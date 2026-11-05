import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    # Simples identifiants : pas de clé étrangère vers les tables des autres services
    patient_id: Mapped[uuid.UUID] = mapped_column(Uuid, index=True, nullable=False)
    doctor_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    # NULL si la notification vient du médecin et non d'un événement
    source_event_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )