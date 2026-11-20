import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class TypeMesure(Base):
    __tablename__ = "types_mesure"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    nom: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True
    )

    unite: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )