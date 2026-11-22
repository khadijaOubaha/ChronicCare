
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.schemas.event import EventAccepted, EventCreate
from app.services import event_service
from app.services.patient_client import get_authorized_patient_id

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.post(
    "",
    response_model=EventAccepted,
    status_code=status.HTTP_201_CREATED,
)
def receive_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # 1. Vérifier le type d'événement avant l'appel interservices.
    if payload.event_type not in event_service.EVENT_TEMPLATES:
        raise HTTPException(
            status_code=422,
            detail=f"Type d'événement inconnu : {payload.event_type}",
        )

    # 2. Vérifier que l'utilisateur peut accéder au dossier patient.
    authorized_patient_id = get_authorized_patient_id(
        current_user,
        payload.patient_id,
    )

    if authorized_patient_id != payload.patient_id:
        raise HTTPException(
            status_code=403,
            detail="Accès non autorisé à ce dossier patient.",
        )

    # 3. Enregistrer l'événement et créer la notification.
    event, notification = event_service.process_event(db, payload)

    return EventAccepted(
        event_id=event.id,
        notification_id=notification.id,
        status="processed",
    )
