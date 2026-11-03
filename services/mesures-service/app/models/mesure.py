import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Mesure(Base):
    __tablename__ = "mesures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False
    )

    type_mesure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("types_mesure.id"),
        nullable=False
    )

    valeur: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    valeur_secondaire: Mapped[float | None] = mapped_column(
        Float,
        nullable=True
    )

    date_mesure: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )

    commentaire: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )