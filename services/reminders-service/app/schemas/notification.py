
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    patient_id: uuid.UUID
    doctor_id: uuid.UUID | None = None
    type: str = Field(min_length=1, max_length=50)
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=2000)


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    doctor_id: uuid.UUID | None
    type: str
    title: str
    message: str
    source_event_id: uuid.UUID | None
    is_read: bool = False
    read_at: datetime | None = None
    created_at: datetime


class NotificationList(BaseModel):
    items: list[NotificationRead]
    total: int
    limit: int
    offset: int

class EventDetails(BaseModel):
    event_type: str
    occurred_at: datetime | None = None
    data: dict = Field(default_factory=dict)
    received_at: datetime


class NotificationDetail(NotificationRead):
    event_details: EventDetails | None = None    
