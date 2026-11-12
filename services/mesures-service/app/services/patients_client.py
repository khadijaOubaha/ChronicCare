"""Client HTTP du service Patients.

Le service Mesures ne lit JAMAIS la table `patients` : il interroge l'API
`GET /api/v1/patients/{patient_id}` du service propriétaire.
"""
import logging
from uuid import UUID

import httpx

from app import config
from app.errors import DomainError
from app.schemas.patient import PatientSummary

logger = logging.getLogger("mesures-service")


class PatientsClient:
    def __init__(self, base_url: str, timeout: float):
        self.base_url = base_url
        self.timeout = timeout

    def get_patient(self, patient_id: UUID) -> PatientSummary:
        url = f"{self.base_url}/api/v1/patients/{patient_id}"
        try:
            response = httpx.get(url, timeout=self.timeout)
        except httpx.HTTPError as exc:  # service éteint, délai dépassé, réseau...
            logger.error("Service Patients injoignable (%s) : %s", self.base_url, exc)
            raise DomainError(
                503,
                "service_patients_indisponible",
                "Le service Patients est momentanément indisponible. "
                "Veuillez réessayer dans un instant.",
            )

        if response.status_code == 404:
            raise DomainError(404, "patient_introuvable", "Patient introuvable.")
        if response.status_code != 200:
            logger.error("Service Patients : réponse HTTP %s", response.status_code)
            raise DomainError(
                502,
                "reponse_patients_invalide",
                "Le service Patients a renvoyé une réponse inattendue.",
            )

        try:
            return PatientSummary.model_validate(response.json())
        except ValueError:  # JSON invalide ou champs inattendus (ValidationError en hérite)
            raise DomainError(
                502,
                "reponse_patients_invalide",
                "Le service Patients a renvoyé une réponse inattendue.",
            )


def get_patients_client() -> PatientsClient:
    """Dépendance FastAPI (remplaçable dans les tests)."""
    return PatientsClient(config.PATIENTS_SERVICE_URL, config.PATIENTS_SERVICE_TIMEOUT)

