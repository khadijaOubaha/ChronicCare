from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import DiseaseType


class PatientSummary(BaseModel):
    """Le strict nécessaire sur un patient, tel que renvoyé par le service Patients.

    On ne garde volontairement ni téléphone, ni email, ni adresse : le service
    Mesures n'en a pas besoin (minimisation des données de santé).
    """

    id: UUID
    first_name: str
    last_name: str
    disease_type: DiseaseType
    is_active: bool