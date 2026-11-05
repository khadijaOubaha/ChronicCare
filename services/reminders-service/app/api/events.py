from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.event import EventAccepted, EventCreate
from app.services import event_service

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.post("", response_model=EventAccepted, status_code=status.HTTP_201_CREATED)
def receive_event(payload: EventCreate, db: Session = Depends(get_db)):
    try:
        event, notification = event_service.process_event(db, payload)
    except event_service.UnknownEventType:
        raise HTTPException(
            status_code=422, detail=f"Type d'événement inconnu : {payload.event_type}"
        )
    return EventAccepted(event_id=event.id, notification_id=notification.id, status="processed")