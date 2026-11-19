
from datetime import datetime, timezone
import logging
import os
from typing import Annotated
from uuid import UUID

import httpx

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
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

REMINDERS_SERVICE_URL = os.getenv(
    "REMINDERS_SERVICE_URL",
    "http://reminders-service:8004",
)

REMINDERS_EVENT_ENDPOINT = os.getenv(
    "REMINDERS_EVENT_ENDPOINT",
    "/api/v1/events",
)

logger = logging.getLogger("treatments.events")


def emit_treatment_event(
    action: str,
    treatment: Treatment,
    token: str | None = None,
) -> None:
    """Envoie un événement au service Reminders."""

    if not REMINDERS_SERVICE_URL:
        return

    payload = {
        "event_type": "treatment.updated",
        "patient_id": str(treatment.patient_id),
        "doctor_id": (
            str(treatment.prescribed_by)
            if treatment.prescribed_by
            else None
        ),
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "data": {
            "treatment_id": str(treatment.id),
            "action": action,
            "medication_name": treatment.medication_name,
            "dosage": treatment.dosage,
        },
    }

    headers = {"Content-Type": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    url = f"{REMINDERS_SERVICE_URL}{REMINDERS_EVENT_ENDPOINT}"

    try:
        with httpx.Client(timeout=3.0) as client:
            resp = client.post(
                url,
                json=payload,
                headers=headers,
            )

            if resp.status_code not in (200, 201, 202, 204):
                logger.warning(
                    "Reminders Service a répondu %s pour treatment.updated (%s)",
                    resp.status_code,
                    action,
                )

    except Exception as exc:
        logger.warning(
            "Impossible de notifier Reminders Service (%s): %s",
            url,
            exc,
        )


def verify_patient(patient_id: UUID, token: str) -> None:
    """Vérifie que le patient existe et qu'il est actif."""

    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = httpx.get(
            f"{PATIENTS_SERVICE_URL}/api/v1/patients/{patient_id}",
            headers=headers,
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
        logger.error(
            "Patients Service a répondu %s lors de la vérification du patient %s: %s",
            response.status_code,
            patient_id,
            response.text,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Impossible de vérifier le patient auprès de Patients Service.",
        )

    try:
        patient = response.json()

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Réponse invalide de Patients Service.",
        )

    if not patient.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Le patient est inactif.",
        )


def get_patient_id_for_user(
    user_id: UUID,
    token: str | None = None,
    db: Session | None = None,
) -> UUID | None:
    """Récupère l'ID du patient associé à un utilisateur."""

    if token:
        try:
            resp = httpx.get(
                f"{PATIENTS_SERVICE_URL}/api/v1/patients/me",
                headers={"Authorization": f"Bearer {token}"},
                timeout=3.0,
            )

            if resp.status_code == 200:
                p_data = resp.json()

                if p_data and "id" in p_data:
                    return UUID(str(p_data["id"]))

        except Exception:
            pass

    if db is not None:
        try:
            res = db.execute(
                text("SELECT id FROM patients WHERE user_id = :user_id"),
                {"user_id": str(user_id)},
            ).scalar_one_or_none()

            if res:
                return UUID(str(res))

        except Exception:
            pass

    return None


@router.post(
    "/treatments",
    response_model=TreatmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_treatment(
    payload: TreatmentCreate,
    db: DbSession,
    current_user: AdminUser,
    background_tasks: BackgroundTasks,
):
    verify_patient(
        payload.patient_id,
        current_user.token,
    )

    treatment = Treatment(
        **payload.model_dump(),
        prescribed_by=current_user.id,
        status=TreatmentStatus.ACTIVE,
    )

    db.add(treatment)
    db.commit()
    db.refresh(treatment)

    background_tasks.add_task(
        emit_treatment_event,
        action="created",
        treatment=treatment,
        token=current_user.token,
    )

    return treatment


@router.get(
    "/treatments/me",
    response_model=list[TreatmentRead],
)
def get_my_treatments(
    db: DbSession,
    current_user: AuthenticatedUser,
):
    if current_user.role == "PATIENT":
        patient_id = get_patient_id_for_user(
            current_user.id,
            token=current_user.token,
            db=db,
        )

        if patient_id is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Aucune fiche patient associée à ce compte.",
            )

        statement = (
            select(Treatment)
            .where(Treatment.patient_id == patient_id)
            .order_by(Treatment.created_at.desc())
        )

    else:
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
    verify_patient(
        patient_id,
        current_user.token,
    )

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
    background_tasks: BackgroundTasks,
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
            detail="Seul un traitement actif peut être arrêté.",
        )

    treatment.status = TreatmentStatus.STOPPED
    db.commit()
    db.refresh(treatment)

    background_tasks.add_task(
        emit_treatment_event,
        action="stopped",
        treatment=treatment,
        token=current_user.token,
    )

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
    background_tasks: BackgroundTasks,
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
            detail="Un traitement non actif ne peut pas être modifié.",
        )

    changes = payload.model_dump(exclude_unset=True)

    new_start = changes.get("start_date", treatment.start_date)
    new_end = changes.get("end_date", treatment.end_date)

    if (
        new_start is not None
        and new_end is not None
        and new_end < new_start
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La date de fin doit être postérieure ou égale à la date de début.",
        )

    for field, value in changes.items():
        setattr(treatment, field, value)

    db.commit()
    db.refresh(treatment)

    background_tasks.add_task(
        emit_treatment_event,
        action="updated",
        treatment=treatment,
        token=current_user.token,
    )

    return treatment


@router.get(
    "/treatments/{treatment_id}",
    response_model=TreatmentRead,
)
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

    if current_user.role == "PATIENT":
        patient_id = get_patient_id_for_user(
            current_user.id,
            token=current_user.token,
            db=db,
        )

        if (
            patient_id is None
            or str(treatment.patient_id) != str(patient_id)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez consulter que vos propres traitements.",
            )

    return treatment
