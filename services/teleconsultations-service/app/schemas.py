from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TeleconsultationStatus(str, Enum):
    SCHEDULED = "SCHEDULED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class TeleconsultationCreate(BaseModel):
    patient_id: UUID
    doctor_id: UUID
    scheduled_at: datetime
    meeting_link: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=2000)


class TeleconsultationUpdate(BaseModel):
    patient_id: Optional[UUID] = None
    doctor_id: Optional[UUID] = None
    scheduled_at: Optional[datetime] = None
    meeting_link: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=2000)


class TeleconsultationStatusUpdate(BaseModel):
    status: TeleconsultationStatus


class TeleconsultationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    doctor_id: UUID
    scheduled_at: datetime
    meeting_link: Optional[str] = None
    status: TeleconsultationStatus
    notes: Optional[str] = None
    created_at: datetime


class TeleconsultationList(BaseModel):
    items: List[TeleconsultationRead]
    total: int
    skip: int
    limit: int
