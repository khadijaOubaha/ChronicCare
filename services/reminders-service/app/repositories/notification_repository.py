
import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.notification_recipient import NotificationRecipient
from app.schemas.notification import NotificationCreate


def create(
    db: Session,
    data: NotificationCreate,
    patient_user_id: uuid.UUID,
    source_event_id: uuid.UUID | None = None,
) -> Notification:
    notification = Notification(
        **data.model_dump(),
        source_event_id=source_event_id,
    )
    db.add(notification)
    db.flush()

    # Destinataire patient : User.id provenant du service Patients
    db.add(
        NotificationRecipient(
            notification_id=notification.id,
            user_id=patient_user_id,
            role="PATIENT",
        )
    )

    # Destinataire médecin : doctor_id est déjà User.id dans Auth
    if data.doctor_id:
        db.add(
            NotificationRecipient(
                notification_id=notification.id,
                user_id=data.doctor_id,
                role="ADMIN",
            )
        )

    db.flush()
    return notification


def get(db: Session, notification_id: uuid.UUID):
    return db.get(Notification, notification_id)


def _list_for_recipient(
    db: Session,
    user_id: uuid.UUID,
    role: str,
    limit: int,
    offset: int,
    unread_only: bool,
    patient_id: uuid.UUID | None = None,
):
    query = (
        select(Notification)
        .join(
            NotificationRecipient,
            NotificationRecipient.notification_id == Notification.id,
        )
        .where(
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.role == role,
        )
    )

    if unread_only:
        query = query.where(NotificationRecipient.is_read.is_(False))

    if patient_id is not None:
        query = query.where(Notification.patient_id == patient_id)

    count_query = select(func.count()).select_from(query.subquery())
    total = db.scalar(count_query) or 0

    items = db.scalars(
        query.order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    ).all()

    return items, total


def list_for_patient(
    db: Session,
    patient_user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
):
    return _list_for_recipient(
        db, patient_user_id, "PATIENT", limit, offset, unread_only
    )


def list_for_doctor(
    db: Session,
    doctor_user_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
    patient_id: uuid.UUID | None = None,
):
   return _list_for_recipient(
    db,
    doctor_user_id,
    "ADMIN",
    limit,
    offset,
    unread_only,
    patient_id,
)


def mark_as_read(
    db: Session,
    notification_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str,
):
    recipient = db.scalar(
        select(NotificationRecipient).where(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == user_id,
            NotificationRecipient.role == role,
        )
    )

    if recipient is None:
        return None

    if not recipient.is_read:
        recipient.is_read = True
        recipient.read_at = datetime.now(timezone.utc)
        db.flush()

    return recipient