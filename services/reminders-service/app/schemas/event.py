import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    event_type: str = Field(min_length=1, max_length=100)
    patient_id: uuid.UUID
    doctor_id: uuid.UUID | None = None
    occurred_at: datetime | None = None
    data: dict = Field(default_factory=dict)


class EventAccepted(BaseModel):
    event_id: uuid.UUID
    notification_id: uuid.UUID
    status: str