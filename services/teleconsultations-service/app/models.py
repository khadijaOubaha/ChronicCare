import uuid
from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, Column, DateTime, String, Text, Uuid

from app.database import Base


def utcnow() -> datetime:
    """Date/heure UTC sans fuseau (toutes les dates du service sont en UTC)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Teleconsultation(Base):
    """Table dont le Teleconsultations Service est propriétaire.

    Conforme au diagramme de classes global de ChronicCare.
    patient_id (Patients Service) et doctor_id (Authentication Service, rôle
    ADMIN) sont de simples références : aucune clé étrangère entre services.
    """

    __tablename__ = "teleconsultations"
    __table_args__ = (
        CheckConstraint(
            "status IN ('SCHEDULED','COMPLETED','CANCELLED')",
            name="ck_teleconsultations_status",
        ),
    )

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(Uuid(as_uuid=True), nullable=False, index=True)
    doctor_id = Column(Uuid(as_uuid=True), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    meeting_link = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="SCHEDULED", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
