import uuid

from sqlalchemy import String, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MaladieMesure(Base):
    __tablename__ = "maladie_mesure"

    __table_args__ = (
        UniqueConstraint(
            "disease_type",
            "type_mesure_id",
            name="uq_maladie_type_mesure"
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    disease_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False
    )

    type_mesure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("types_mesure.id"),
        nullable=False
    )