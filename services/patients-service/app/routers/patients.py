
import os
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientListResponse, PatientRead, PatientUpdate
from app.security import CurrentUser, get_current_user, require_admin


AUTH_SERVICE_URL = os.environ.get(
    "AUTH_SERVICE_URL",
    "http://auth-service:8000",
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="http://localhost:8000/api/v1/auth/login",
    auto_error=False,
)

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])

DbSession = Annotated[Session, Depends(get_db)]
AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
AdminUser = Annotated[CurrentUser, Depends(require_admin)]


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(
    payload: PatientCreate,
    db: DbSession,
    current_user: AdminUser,
    token: Annotated[str | None, Depends(oauth2_scheme)],
):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton d'authentification manquant.",
        )

    # 1. Préparer les informations du compte
    full_name = f"{payload.first_name.strip()} {payload.last_name.strip()}"

    account_data = {
        "full_name": full_name,
        "email": str(payload.email).lower(),
        "password": payload.password,
    }

    # 2. Créer le compte dans Auth Service
    try:
        response = httpx.post(
            f"{AUTH_SERVICE_URL}/api/v1/auth/create-patient",
            json=account_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=10.0,
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Auth Service ne répond pas dans le délai prévu.",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Impossible de contacter Auth Service.",
        )

    if response.status_code == status.HTTP_409_CONFLICT:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cette adresse e-mail est déjà utilisée.",
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=response.status_code,
            detail="Autorisation refusée par Auth Service.",
        )

    if response.status_code != status.HTTP_201_CREATED:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth Service n'a pas pu créer le compte patient.",
        )

    # 3. Récupérer l'identifiant du compte créé
    try:
        account = response.json()
        user_id = UUID(account["id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Réponse invalide reçue depuis Auth Service.",
        )

    # 4. Créer la fiche patient liée au compte
    patient_data = payload.model_dump(
        exclude={"password", "email"}
    )
    patient_data["email"] = str(payload.email).lower()

    patient = Patient(
        **patient_data,
        user_id=user_id,
    )

    try:
        db.add(patient)
        db.commit()
        db.refresh(patient)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Le compte utilisateur a été créé, mais la fiche patient "
                "n'a pas pu être enregistrée. Contactez l'administrateur."
            ),
        )

    return patient


@router.get("", response_model=PatientListResponse)
def list_patients(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(
        default=None,
        description="Recherche dans prénom, nom ou email",
    ),
    status_filter: str | None = Query(
        default=None,
        alias="status",
        description="Filtrer par statut : active, inactive",
    ),
    disease: str | None = Query(
        default=None,
        description="Filtrer par pathologie",
    ),
    db: DbSession = ...,
    current_user: AdminUser = ...,
):
    stmt = select(Patient)

    if search:
        q = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Patient.first_name).like(q),
                func.lower(Patient.last_name).like(q),
                func.lower(Patient.email).like(q),
            )
        )

    if status_filter == "active":
        stmt = stmt.where(Patient.is_active == True)  # noqa: E712
    elif status_filter == "inactive":
        stmt = stmt.where(Patient.is_active == False)  # noqa: E712

    if disease:
        stmt = stmt.where(Patient.disease == disease)

    total = db.scalar(
        select(func.count()).select_from(stmt.subquery())
    )

    patients = list(
        db.scalars(
            stmt.order_by(Patient.created_at.desc())
            .offset(offset)
            .limit(limit)
        ).all()
    )

    return PatientListResponse(
        items=patients,
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/me", response_model=PatientRead)
def get_my_patient_profile(
    db: DbSession,
    current_user: AuthUser,
):
    """Retourne la fiche patient de l'utilisateur connecté."""
    patient = db.scalar(
        select(Patient).where(Patient.user_id == current_user.id)
    )

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune fiche patient associée à ce compte.",
        )

    return patient


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(
    patient_id: UUID,
    db: DbSession,
    current_user: AuthUser,
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient introuvable.",
        )

    if current_user.role == "PATIENT" and patient.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé à votre propre dossier.",
        )

    return patient


@router.patch("/{patient_id}", response_model=PatientRead)
def update_patient(
    patient_id: UUID,
    payload: PatientUpdate,
    db: DbSession,
    current_user: AdminUser,
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient introuvable.",
        )

    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)

    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(
    patient_id: UUID,
    db: DbSession,
    current_user: AdminUser,
):
    patient = db.get(Patient, patient_id)

    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient introuvable.",
        )

    db.delete(patient)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
