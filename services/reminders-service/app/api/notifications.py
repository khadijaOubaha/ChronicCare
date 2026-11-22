
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser, get_current_user, require_admin
from app.repositories import notification_repository as repo
from app.schemas.notification import (
    NotificationCreate,
    NotificationList,
    NotificationRead,
)
from app.services.patient_client import get_authorized_patient_id

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


def _get_authorized_notification(
    db: Session,
    notification_id: uuid.UUID,
    current_user: CurrentUser,
):
    notification = repo.get(db, notification_id)

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification introuvable",
        )

    get_authorized_patient_id(
        current_user,
        requested_patient_id=notification.patient_id,
    )

    return notification


@router.post(
    "",
    response_model=NotificationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    get_authorized_patient_id(
        current_user,
        requested_patient_id=payload.patient_id,
    )

    return repo.create(db, payload)


@router.get("", response_model=NotificationList)
def list_notifications(
    patient_id: uuid.UUID | None = None,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    authorized_patient_id = get_authorized_patient_id(
        current_user,
        requested_patient_id=patient_id,
    )

    items, total = repo.list_for_patient(
        db,
        authorized_patient_id,
        limit,
        offset,
        unread_only,
    )

    return NotificationList(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    return _get_authorized_notification(
        db,
        notification_id,
        current_user,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationRead,
)
def mark_notification_as_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    notification = _get_authorized_notification(
        db,
        notification_id,
        current_user,
    )

    return repo.mark_as_read(db, notification)
