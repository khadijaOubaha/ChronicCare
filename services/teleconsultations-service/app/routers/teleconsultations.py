from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Teleconsultation, utcnow
from app.schemas import (
    TeleconsultationCreate,
    TeleconsultationList,
    TeleconsultationRead,
    TeleconsultationStatus,
    TeleconsultationStatusUpdate,
    TeleconsultationUpdate,
)

router = APIRouter(prefix="/api/v1/teleconsultations", tags=["teleconsultations"])

# Transitions de statut autorisées
ALLOWED_TRANSITIONS = {
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
        Teleconsultation.status != "CANCELLED",
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


@router.post("", response_model=TeleconsultationRead, status_code=status.HTTP_201_CREATED)
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
):
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
def get_teleconsultation(teleconsultation_id: UUID, db: Session = Depends(get_db)):
    return get_or_404(db, teleconsultation_id)


@router.put("/{teleconsultation_id}", response_model=TeleconsultationRead)
def update_teleconsultation(
    teleconsultation_id: UUID,
    payload: TeleconsultationUpdate,
    db: Session = Depends(get_db),
):
    item = get_or_404(db, teleconsultation_id)
    if item.status in TERMINAL_STATUSES:
        raise HTTPException(
            status_code=409,
            detail="Une téléconsultation terminée ou annulée ne peut plus être modifiée",
        )

    data = payload.model_dump(exclude_unset=True)
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


@router.patch("/{teleconsultation_id}/status", response_model=TeleconsultationRead)
def change_status(
    teleconsultation_id: UUID,
    payload: TeleconsultationStatusUpdate,
    db: Session = Depends(get_db),
):
    item = get_or_404(db, teleconsultation_id)
    new_status = payload.status.value
    if new_status not in ALLOWED_TRANSITIONS[item.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Transition interdite : {item.status} -> {new_status}",
        )
    item.status = new_status
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{teleconsultation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teleconsultation(teleconsultation_id: UUID, db: Session = Depends(get_db)):
    item = get_or_404(db, teleconsultation_id)
    db.delete(item)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
