import os
import httpx

from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Teleconsultation, utcnow
from app.security import (
    ROLE_PATIENT,
    CurrentUser,
    get_current_user,
    require_admin,
    require_patient,
)
from app.schemas import (
    TeleconsultationConfirm,
    TeleconsultationCreate,
    TeleconsultationList,
    TeleconsultationRead,
    TeleconsultationRequestCreate,
    TeleconsultationStatus,
    TeleconsultationStatusUpdate,
    TeleconsultationUpdate,
)

router = APIRouter(prefix="/api/v1/teleconsultations", tags=["teleconsultations"])

def get_patient_id_from_patients_service(user: CurrentUser) -> UUID:
    base_url = os.getenv("PATIENTS_SERVICE_URL")

    if not base_url:
        raise HTTPException(
            status_code=500,
            detail="PATIENTS_SERVICE_URL n'est pas configurée.",
        )

    if not user.access_token:
        raise HTTPException(
            status_code=401,
            detail="Token utilisateur manquant.",
        )

    try:
        response = httpx.get(
            f"{base_url.rstrip('/')}/api/v1/patients/me",
            headers={
                "Authorization": f"Bearer {user.access_token}"
            },
            timeout=5.0,
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Délai dépassé lors de l'appel au Patients Service.",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Patients Service est indisponible.",
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Aucun dossier patient associé à ce compte.",
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=response.status_code,
            detail="Authentification refusée par Patients Service.",
        )

    if not response.is_success:
        raise HTTPException(
            status_code=502,
            detail="Erreur lors de la récupération du dossier patient.",
        )

    try:
        patient_data = response.json()
        return UUID(str(patient_data["id"]))
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Identifiant patient invalide.",
        )

@router.get("/doctors")
def list_doctors(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    query = text("""
        SELECT id, full_name
        FROM users
        WHERE role = 'ADMIN'
          AND is_active = TRUE
        ORDER BY full_name
    """)

    doctors = db.execute(query).mappings().all()

    return [
        {
            "id": str(doctor["id"]),
            "full_name": doctor["full_name"],
        }
        for doctor in doctors
    ]
# Transitions de statut autorisées
ALLOWED_TRANSITIONS = {
    # Demande du patient : confirmée (-> SCHEDULED, via /confirm) ou refusée.
    "REQUESTED": {"SCHEDULED", "CANCELLED"},
    "SCHEDULED": {"COMPLETED", "CANCELLED"},
    "COMPLETED": set(),
    "CANCELLED": set(),
}
TERMINAL_STATUSES = {"COMPLETED", "CANCELLED"}


def to_naive_utc(value: datetime) -> datetime:
    """Convertit une date en UTC sans fuseau (les dates sans fuseau sont supposées UTC)."""
    if value.tzinfo is not None:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    return value


def get_or_404(db: Session, teleconsultation_id: UUID) -> Teleconsultation:
    item = db.get(Teleconsultation, teleconsultation_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Téléconsultation introuvable")
    return item


def ensure_slot_free(
    db: Session,
    doctor_id: UUID,
    patient_id: UUID,
    when: datetime,
    exclude_id: Optional[UUID] = None,
) -> None:
    """Refuse deux consultations au même instant pour le même médecin ou patient."""
    query = select(Teleconsultation.id).where(
        # Une demande (REQUESTED) ou une annulation ne bloque pas le créneau.
        Teleconsultation.status.in_(("SCHEDULED", "COMPLETED")),
        Teleconsultation.scheduled_at == when,
        or_(
            Teleconsultation.doctor_id == doctor_id,
            Teleconsultation.patient_id == patient_id,
        ),
    )
    if exclude_id is not None:
        query = query.where(Teleconsultation.id != exclude_id)
    if db.execute(query.limit(1)).first() is not None:
        raise HTTPException(
            status_code=409,
            detail="Le médecin ou le patient a déjà une téléconsultation à cette date",
        )


@router.post(
    "",
    response_model=TeleconsultationRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_teleconsultation(payload: TeleconsultationCreate, db: Session = Depends(get_db)):
    when = to_naive_utc(payload.scheduled_at)
    if when <= utcnow():
        raise HTTPException(status_code=400, detail="La date doit être dans le futur")
    ensure_slot_free(db, payload.doctor_id, payload.patient_id, when)

    item = Teleconsultation(
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        scheduled_at=when,
        meeting_link=payload.meeting_link,
        status="SCHEDULED",
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post(
    "/requests",
    response_model=TeleconsultationRead,
    status_code=status.HTTP_201_CREATED,
)
def request_teleconsultation(
    payload: TeleconsultationRequestCreate,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(require_patient),
):
    """Le patient demande une téléconsultation (statut REQUESTED).

    patient_id est récupéré depuis le dossier associé au compte connecté.
    La demande ne bloque aucun créneau.    """
    when = None
    if payload.scheduled_at is not None:
        when = to_naive_utc(payload.scheduled_at)
        if when <= utcnow():
            raise HTTPException(status_code=400, detail="La date doit être dans le futur")
    # Récupérer le véritable Patient.id
    patient_id = get_patient_id_from_patients_service(user)
    item = Teleconsultation(
        patient_id=patient_id,
        doctor_id=payload.doctor_id,
        scheduled_at=when,
        status="REQUESTED",
        notes=payload.notes,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=TeleconsultationList)
def list_teleconsultations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    patient_id: Optional[UUID] = None,
    doctor_id: Optional[UUID] = None,
    status_filter: Optional[TeleconsultationStatus] = Query(None, alias="status"),
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    # Un patient ne voit que ses propres téléconsultations.
    # On utilise l'identifiant de son dossier Patients, pas celui de son compte Auth.
    if user.role == ROLE_PATIENT:
        patient_id = get_patient_id_from_patients_service(user)
    filters = []
    if patient_id is not None:
        filters.append(Teleconsultation.patient_id == patient_id)
    if doctor_id is not None:
        filters.append(Teleconsultation.doctor_id == doctor_id)
    if status_filter is not None:
        filters.append(Teleconsultation.status == status_filter.value)
    if date_from is not None:
        filters.append(Teleconsultation.scheduled_at >= to_naive_utc(date_from))
    if date_to is not None:
        filters.append(Teleconsultation.scheduled_at <= to_naive_utc(date_to))

    total = db.execute(
        select(func.count()).select_from(Teleconsultation).where(*filters)
    ).scalar_one()
    items = (
        db.execute(
            select(Teleconsultation)
            .where(*filters)
            .order_by(Teleconsultation.scheduled_at, Teleconsultation.created_at)
            .offset(skip)
            .limit(limit)
        )
        .scalars()
        .all()
    )
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/{teleconsultation_id}", response_model=TeleconsultationRead)
def get_teleconsultation(
    teleconsultation_id: UUID,
    db: Session = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    item = get_or_404(db, teleconsultation_id)

    # Vérifier l'accès avec le véritable identifiant du dossier patient.
    if user.role == ROLE_PATIENT:
        patient_id = get_patient_id_from_patients_service(user)

        if item.patient_id != patient_id:
            raise HTTPException(
                status_code=404,
                detail="Téléconsultation introuvable",
            )

    return item


@router.put(
    "/{teleconsultation_id}",
    response_model=TeleconsultationRead,
    dependencies=[Depends(require_admin)],
)
def update_teleconsultation(
    teleconsultation_id: UUID,
    payload: TeleconsultationUpdate,
    db: Session = Depends(get_db),
):
    item = get_or_404(db, teleconsultation_id)
    if item.status == "CANCELLED":
        raise HTTPException(
            status_code=409,
            detail="Une téléconsultation annulée ne peut plus être modifiée",
        )

    data = payload.model_dump(exclude_unset=True)

    if item.status == "REQUESTED":
        # Une demande se traite par /confirm (date) ou par un refus ; seules les
        # notes et le lien peuvent être ajustés ici.
        if set(data) - {"notes", "meeting_link"}:
            raise HTTPException(
                status_code=409,
                detail="Une demande se confirme via /confirm : seules les notes et le lien sont modifiables",
            )
        for field in ("meeting_link", "notes"):
            if field in data:
                setattr(item, field, data[field])
        db.commit()
        db.refresh(item)
        return item

    if item.status == "COMPLETED":
        # Terminée : seul le compte rendu (notes) reste modifiable.
        if set(data) - {"notes"}:
            raise HTTPException(
                status_code=409,
                detail="Une téléconsultation terminée : seules les notes peuvent être modifiées",
            )
        if "notes" in data:
            item.notes = data["notes"]
        db.commit()
        db.refresh(item)
        return item

    new_when = item.scheduled_at
    if data.get("scheduled_at") is not None:
        new_when = to_naive_utc(data["scheduled_at"])
        if new_when != item.scheduled_at and new_when <= utcnow():
            raise HTTPException(status_code=400, detail="La date doit être dans le futur")
    new_doctor = data.get("doctor_id") or item.doctor_id
    new_patient = data.get("patient_id") or item.patient_id
    ensure_slot_free(db, new_doctor, new_patient, new_when, exclude_id=item.id)

    item.doctor_id = new_doctor
    item.patient_id = new_patient
    item.scheduled_at = new_when
    for field in ("meeting_link", "notes"):
        if field in data:
            setattr(item, field, data[field])
    db.commit()
    db.refresh(item)
    return item


@router.patch(
    "/{teleconsultation_id}/confirm",
    response_model=TeleconsultationRead,
    dependencies=[Depends(require_admin)],
)
def confirm_request(
    teleconsultation_id: UUID,
    payload: TeleconsultationConfirm,
    db: Session = Depends(get_db),
):
    """Le médecin confirme une demande : REQUESTED -> SCHEDULED (date et lien)."""
    item = get_or_404(db, teleconsultation_id)
    if item.status != "REQUESTED":
        raise HTTPException(
            status_code=409,
            detail=f"Transition interdite : {item.status} -> SCHEDULED",
        )
    when = to_naive_utc(payload.scheduled_at)
    if when <= utcnow():
        raise HTTPException(status_code=400, detail="La date doit être dans le futur")
    ensure_slot_free(db, item.doctor_id, item.patient_id, when, exclude_id=item.id)

    item.scheduled_at = when
    item.meeting_link = payload.meeting_link
    if payload.notes is not None:
        item.notes = payload.notes
    item.status = "SCHEDULED"
    db.commit()
    db.refresh(item)
    return item


@router.patch(
    "/{teleconsultation_id}/status",
    response_model=TeleconsultationRead,
    dependencies=[Depends(require_admin)],
)
def change_status(
    teleconsultation_id: UUID,
    payload: TeleconsultationStatusUpdate,
    db: Session = Depends(get_db),
):
    item = get_or_404(db, teleconsultation_id)
    new_status = payload.status.value
    if item.status == "REQUESTED" and new_status == "SCHEDULED":
        raise HTTPException(
            status_code=409,
            detail="Pour confirmer une demande, utilisez /confirm (date obligatoire)",
        )
    if new_status not in ALLOWED_TRANSITIONS[item.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Transition interdite : {item.status} -> {new_status}",
        )
    item.status = new_status
    db.commit()
    db.refresh(item)
    return item


@router.delete(
    "/{teleconsultation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_teleconsultation(teleconsultation_id: UUID, db: Session = Depends(get_db)):
    item = get_or_404(db, teleconsultation_id)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
