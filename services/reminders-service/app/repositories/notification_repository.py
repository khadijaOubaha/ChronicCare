import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate


def create(
    db: Session, data: NotificationCreate, source_event_id: uuid.UUID | None = None
) -> Notification:
    notification = Notification(**data.model_dump(), source_event_id=source_event_id)
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def get(db: Session, notification_id: uuid.UUID) -> Notification | None:
    return db.get(Notification, notification_id)


def list_for_patient(
    db: Session,
    patient_id: uuid.UUID,
    limit: int,
    offset: int,
    unread_only: bool = False,
) -> tuple[list[Notification], int]:
    query = select(Notification).where(Notification.patient_id == patient_id)
    if unread_only:
        query = query.where(Notification.is_read.is_(False))

    total = db.scalar(select(func.count()).select_from(query.subquery()))
    items = db.scalars(
        query.order_by(Notification.created_at.desc()).limit(limit).offset(offset)
    ).all()
    return list(items), total or 0


def mark_as_read(db: Session, notification: Notification) -> Notification:
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification