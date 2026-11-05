import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories import notification_repository as repo
from app.schemas.notification import NotificationCreate, NotificationList, NotificationRead

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


def _get_or_404(db: Session, notification_id: uuid.UUID):
    notification = repo.get(db, notification_id)
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    return notification


@router.post("", response_model=NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    return repo.create(db, payload)


@router.get("", response_model=NotificationList)
def list_notifications(
    patient_id: uuid.UUID,  # temporaire, en attendant l'authentification
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    unread_only: bool = False,
    db: Session = Depends(get_db),
):
    items, total = repo.list_for_patient(db, patient_id, limit, offset, unread_only)
    return NotificationList(items=items, total=total, limit=limit, offset=offset)


@router.get("/{notification_id}", response_model=NotificationRead)
def get_notification(notification_id: uuid.UUID, db: Session = Depends(get_db)):
    return _get_or_404(db, notification_id)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_as_read(notification_id: uuid.UUID, db: Session = Depends(get_db)):
    notification = _get_or_404(db, notification_id)
    return repo.mark_as_read(db, notification)