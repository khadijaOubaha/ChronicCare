
from sqlalchemy.orm import Session

from app.models.event import EventReceived


def create(db: Session, data) -> EventReceived:
    event = EventReceived(
        event_type=data.event_type,
        payload=data.model_dump(mode="json"),
    )
    db.add(event)
    db.flush()
    return event


def mark_processed(db: Session, event: EventReceived) -> EventReceived:
    event.processed = True
    db.flush()
    return event