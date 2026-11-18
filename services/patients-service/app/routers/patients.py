from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Patient
from app.schemas import PatientCreate, PatientListResponse, PatientRead, PatientUpdate
from app.security import CurrentUser, get_current_user, require_admin

router = APIRouter(prefix="/api/v1/patients", tags=["Patients"])

DbSession = Annotated[Session, Depends(get_db)]
AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
AdminUser = Annotated[CurrentUser, Depends(require_admin)]


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: DbSession, current_user: AdminUser):
    patient = Patient(**payload.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("", response_model=PatientListResponse)
def list_patients(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None, description="Recherche dans prénom, nom ou email"),
    status_filter: str | None = Query(default=None, alias="status", description="Filtrer par statut : active, inactive"),
    disease: str | None = Query(default=None, description="Filtrer par pathologie"),
    db: DbSession = ...,
    current_user: AdminUser = ...,
):
    stmt = select(Patient)

    if search:
        q = f"%{search.lower()}%"
        from sqlalchemy import or_
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

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    patients = list(db.scalars(stmt.order_by(Patient.created_at.desc()).offset(offset).limit(limit)).all())
    return PatientListResponse(items=patients, total=total, offset=offset, limit=limit)


@router.get("/me", response_model=PatientRead)
def get_my_patient_profile(db: DbSession, current_user: AuthUser):
    """Retourne la fiche patient de l'utilisateur connecté (PATIENT)."""
    patient = db.scalar(select(Patient).where(Patient.user_id == current_user.id))
    if patient is None:
        raise HTTPException(status_code=404, detail="Aucune fiche patient associée à ce compte.")
    return patient


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: UUID, db: DbSession, current_user: AuthUser):
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient introuvable")

    # Un patient ne peut consulter que son propre dossier
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
        raise HTTPException(status_code=404, detail="Patient introuvable")

    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: UUID, db: DbSession, current_user: AdminUser):
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient introuvable")

    db.delete(patient)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
