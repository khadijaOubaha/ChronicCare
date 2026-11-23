
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.schemas.event import EventCreate, EventAccepted
from app.services.patient_client import get_authorized_patient
from app.services import event_service


router = APIRouter(
    prefix="/api/v1/events",
    tags=["events"],
)


@router.post("", response_model=EventAccepted, status_code=201)
def receive_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if payload.event_type not in event_service.EVENT_TEMPLATES:
        raise HTTPException(
            status_code=422,
            detail=f"Type d'événement inconnu : {payload.event_type}",
        )

    patient_identity = get_authorized_patient(
        current_user,
        payload.patient_id,
    )

    event, notification = event_service.process_event(
        db,
        payload,
        patient_user_id=patient_identity.user_id,
    )

    return EventAccepted(
        event_id=event.id,
        notification_id=notification.id,
        status="processed",
    )