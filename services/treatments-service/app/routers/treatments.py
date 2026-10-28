
import os
from typing import Annotated
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.treatment import Treatment, TreatmentStatus
from app.schemas.treatment import (
    TreatmentCreate,
    TreatmentRead,
    TreatmentUpdate,
)
from app.security import CurrentUser, get_current_user, require_admin

router = APIRouter(prefix="/api/v1", tags=["Treatments"])

DbSession = Annotated[Session, Depends(get_db)]
AuthenticatedUser = Annotated[CurrentUser, Depends(get_current_user)]
AdminUser = Annotated[CurrentUser, Depends(require_admin)]

PATIENTS_SERVICE_URL = os.getenv(
    "PATIENTS_SERVICE_URL",
    "http://patients-service:8001",
)


def verify_patient(patient_id: UUID) -> None:
    """Verify that the patient exists and is active in Patients Service."""
    try:
        response = httpx.get(
            f"{PATIENTS_SERVICE_URL}/api/v1/patients/{patient_id}",
            timeout=5.0,
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Patients Service est indisponible.",
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient introuvable.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible de verifier le patient.",
        )

    try:
        patient = response.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Reponse invalide de Patients Service.",
        )

    if not patient.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le patient est inactif.",
        )


@router.post(
    "/treatments",
    response_model=TreatmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_treatment(
    payload: TreatmentCreate,
    db: DbSession,
    current_user: AdminUser,
):
    verify_patient(payload.patient_id)

    treatment = Treatment(
        **payload.model_dump(),
        prescribed_by=current_user.id,
        status=TreatmentStatus.ACTIVE,
    )

    db.add(treatment)
    db.commit()
    db.refresh(treatment)
    return treatment


@router.get("/treatments/me", response_model=list[TreatmentRead])
def get_my_treatments(
    db: DbSession,
    current_user: AuthenticatedUser,
):
    if current_user.role == "PATIENT":
        # The shared database currently stores the link between
        # Auth users and Patients records in patients.user_id.
        patient_id = db.execute(
            text("SELECT id FROM patients WHERE user_id = :user_id"),
            {"user_id": str(current_user.id)},
        ).scalar_one_or_none()

        if patient_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucune fiche patient associee a ce compte.",
            )

        statement = (
            select(Treatment)
            .where(Treatment.patient_id == patient_id)
            .order_by(Treatment.created_at.desc())
        )
    else:
        # A doctor can see all treatments.
        statement = select(Treatment).order_by(
            Treatment.created_at.desc()
        )

    return list(db.scalars(statement).all())


@router.get(
    "/patients/{patient_id}/treatments",
    response_model=list[TreatmentRead],
)
def get_patient_treatments(
    patient_id: UUID,
    db: DbSession,
    current_user: AdminUser,
):
    verify_patient(patient_id)

    statement = (
        select(Treatment)
        .where(Treatment.patient_id == patient_id)
        .order_by(Treatment.created_at.desc())
    )
    return list(db.scalars(statement).all())


@router.patch(
    "/treatments/{treatment_id}/stop",
    response_model=TreatmentRead,
)
def stop_treatment(
    treatment_id: UUID,
    db: DbSession,
    current_user: AdminUser,
):
    treatment = db.get(Treatment, treatment_id)

    if treatment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traitement introuvable.",
        )

    if treatment.status != TreatmentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Seul un traitement actif peut etre arrete.",
        )

    treatment.status = TreatmentStatus.STOPPED
    db.commit()
    db.refresh(treatment)
    return treatment


@router.patch(
    "/treatments/{treatment_id}",
    response_model=TreatmentRead,
)
def update_treatment(
    treatment_id: UUID,
    payload: TreatmentUpdate,
    db: DbSession,
    current_user: AdminUser,
):
    treatment = db.get(Treatment, treatment_id)

    if treatment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traitement introuvable.",
        )

    if treatment.status != TreatmentStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un traitement non actif ne peut pas etre modifie.",
        )

    changes = payload.model_dump(exclude_unset=True)

    # Validate the resulting dates, including unchanged values.
    new_start = changes.get("start_date", treatment.start_date)
    new_end = changes.get("end_date", treatment.end_date)

    if new_start is not None and new_end is not None and new_end < new_start:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La date de fin doit etre posterieure ou egale a la date de debut.",
        )

    for field, value in changes.items():
        setattr(treatment, field, value)

    db.commit()
    db.refresh(treatment)
    return treatment


@router.get("/treatments/{treatment_id}", response_model=TreatmentRead)
def get_treatment(
    treatment_id: UUID,
    db: DbSession,
    current_user: AuthenticatedUser,
):
    treatment = db.get(Treatment, treatment_id)

    if treatment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Traitement introuvable.",
        )

    if (
        current_user.role == "PATIENT"
        and str(treatment.patient_id)
        != str(
            db.execute(
                text("SELECT id FROM patients WHERE user_id = :user_id"),
                {"user_id": str(current_user.id)},
            ).scalar_one_or_none()
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez consulter que vos propres traitements.",
        )

    return treatment
