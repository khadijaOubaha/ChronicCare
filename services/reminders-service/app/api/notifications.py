
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user
from app.models.notification import Notification
from app.models.notification_recipient import NotificationRecipient
from app.repositories import notification_repository
from app.schemas.notification import (
    NotificationCreate,
    NotificationRead,
    NotificationList,
)
from app.services.patient_client import get_authorized_patient


router = APIRouter(
    prefix="/api/v1/notifications",
    tags=["notifications"],
)


def _get_recipient(
    db: Session,
    notification_id: UUID,
    current_user: CurrentUser,
):
    return db.scalar(
        select(NotificationRecipient).where(
            NotificationRecipient.notification_id == notification_id,
            NotificationRecipient.user_id == current_user.id,
            NotificationRecipient.role == current_user.role,
        )
    )


def _notification_response(
    notification: Notification,
    recipient: NotificationRecipient,
) -> NotificationRead:
    response = NotificationRead.model_validate(notification)

    return response.model_copy(
        update={
            "is_read": recipient.is_read,
            "read_at": recipient.read_at,
        }
    )


@router.get("", response_model=NotificationList)
def list_notifications(
    patient_id: UUID | None = None,
    unread_only: bool = False,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role == "PATIENT":
        identity = get_authorized_patient(current_user)

        if patient_id is not None and patient_id != identity.patient_id:
            raise HTTPException(
                status_code=403,
                detail="Accès interdit à ce patient",
            )

        items, total = notification_repository.list_for_patient(
            db,
            current_user.id,
            limit,
            offset,
            unread_only,
        )

    elif current_user.role == "ADMIN":
        items, total = notification_repository.list_for_doctor(
            db,
            current_user.id,
            limit,
            offset,
            unread_only,
            patient_id,
        )

        if patient_id is not None:
            items = [item for item in items if item.patient_id == patient_id]
            # Le filtrage patient_id devra être déplacé dans
            # la requête SQL pour une pagination exacte.

    else:
        raise HTTPException(status_code=403, detail="Accès interdit")

    result = []

    for notification in items:
        recipient = _get_recipient(db, notification.id, current_user)

        if recipient is not None:
            result.append(_notification_response(notification, recipient))

    return NotificationList(
        items=result,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    notification = notification_repository.get(db, notification_id)

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification introuvable",
        )

    recipient = _get_recipient(db, notification_id, current_user)

    if recipient is None:
        raise HTTPException(
            status_code=403,
            detail="Accès interdit à cette notification",
        )

    return _notification_response(notification, recipient)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_as_read(
    notification_id: UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    notification = notification_repository.get(db, notification_id)

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification introuvable",
        )

    recipient = notification_repository.mark_as_read(
        db,
        notification_id,
        current_user.id,
        current_user.role,
    )

    if recipient is None:
        raise HTTPException(
            status_code=403,
            detail="Accès interdit à cette notification",
        )

    db.commit()
    db.refresh(recipient)

    return _notification_response(notification, recipient)