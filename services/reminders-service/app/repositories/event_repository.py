
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.event import EventReceived


def create(db: Session, data) -> EventReceived:
    # Convertir les données de l'événement en JSON
    event_payload = data.model_dump(mode="json")

    # Ajouter automatiquement la date si elle n'est pas fournie
    if not event_payload.get("occurred_at"):
        event_payload["occurred_at"] = datetime.now(
            timezone.utc
        ).isoformat()

    event = EventReceived(
        event_type=data.event_type,
        payload=event_payload,
    )

    db.add(event)
    db.flush()
    return event


def mark_processed(db: Session, event: EventReceived) -> EventReceived:
    event.processed = True
    db.flush()
    return event
