from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


DISEASE_CHOICES = Literal["TYPE_2_DIABETES", "HYPERTENSION", None]


class PatientCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    date_of_birth: date | None = None
    sex: Literal["F", "M", "OTHER"] | None = None
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)
    disease: Literal["TYPE_2_DIABETES", "HYPERTENSION"] | None = None


class PatientUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    date_of_birth: date | None = None
    sex: Literal["F", "M", "OTHER"] | None = None
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = Field(default=None, max_length=500)
    disease: Literal["TYPE_2_DIABETES", "HYPERTENSION"] | None = None
    is_active: bool | None = None


class PatientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID | None = None
    first_name: str
    last_name: str
    date_of_birth: date | None
    sex: str | None
    phone: str | None
    email: str | None
    address: str | None
    disease: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class PatientListResponse(BaseModel):
    items: list[PatientRead]
    total: int
    offset: int
    limit: int
