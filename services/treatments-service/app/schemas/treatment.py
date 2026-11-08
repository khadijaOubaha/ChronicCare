from datetime import date, datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
    field_validator,
)

from app.models.treatment import TreatmentStatus, Disease


class TreatmentCreate(BaseModel):
    patient_id: UUID
    disease: Disease
    medication_name: str = Field(min_length=1, max_length=200)
    dosage: str = Field(min_length=1, max_length=100)
    frequency: str = Field(min_length=1, max_length=200)
    start_date: date
    end_date: date | None = None
    instructions: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError(
                "La date de fin doit être postérieure ou égale à la date de début."
            )
        return self


class TreatmentUpdate(BaseModel):
    disease: Disease | None = None
    medication_name: str | None = Field(
        default=None, min_length=1, max_length=200
    )
    dosage: str | None = Field(default=None, min_length=1, max_length=100)
    frequency: str | None = Field(default=None, min_length=1, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    instructions: str | None = None

    @field_validator("disease")
    @classmethod
    def validate_disease(cls, value):
        if value is None:
            raise ValueError("Le champ disease ne peut pas être null.")
        return value


class TreatmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    patient_id: UUID
    prescribed_by: UUID
    disease: Disease
    medication_name: str
    dosage: str
    frequency: str
    start_date: date
    end_date: date | None
    instructions: str | None
    status: TreatmentStatus
    created_at: datetime
    updated_at: datetime