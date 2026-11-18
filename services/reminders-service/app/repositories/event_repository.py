from sqlalchemy.orm import Session

from app.models.event import EventReceived
from app.schemas.event import EventCreate


def create(db: Session, data: EventCreate) -> EventReceived:
    event = EventReceived(
        event_type=data.event_type,
        payload=data.model_dump(mode="json"),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def mark_processed(db: Session, event: EventReceived) -> EventReceived:
    event.processed = True
    db.commit()
    db.refresh(event)
    return event