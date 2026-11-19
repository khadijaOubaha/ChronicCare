
"""Client HTTP du service Patients."""

import logging
from uuid import UUID

import httpx

from app import config
from app.errors import DomainError
from app.schemas.patient import PatientSummary

logger = logging.getLogger("mesures-service")


# Conversion du contrat Patients vers le contrat Mesures.
DISEASE_MAPPING = {
    "TYPE_2_DIABETES": "diabetes_type_2",
    "HYPERTENSION": "hypertension",
}


class PatientsClient:
    def __init__(self, base_url: str, timeout: float):
        self.base_url = base_url
        self.timeout = timeout

    def get_patient(
        self,
        patient_id: UUID,
        authorization: str | None = None,
    ) -> PatientSummary:
        url = f"{self.base_url}/api/v1/patients/{patient_id}"

        headers = {}
        if authorization:
            headers["Authorization"] = authorization

        try:
            response = httpx.get(
                url,
                headers=headers,
                timeout=self.timeout,
            )
        except httpx.HTTPError as exc:
            logger.error(
                "Service Patients injoignable (%s) : %s",
                self.base_url,
                exc,
            )
            raise DomainError(
                503,
                "service_patients_indisponible",
                "Le service Patients est momentanément indisponible. "
                "Veuillez réessayer dans un instant.",
            ) from exc

        if response.status_code == 404:
            raise DomainError(
                404,
                "patient_introuvable",
                "Patient introuvable.",
            )

        if response.status_code != 200:
            logger.error(
                "Service Patients : réponse HTTP %s",
                response.status_code,
            )
            raise DomainError(
                502,
                "reponse_patients_invalide",
                "Le service Patients a renvoyé une réponse inattendue.",
            )

        try:
            patient_data = response.json()

            # Le service Patients utilise le champ "disease".
            disease = patient_data.pop("disease", None)

            # Conversion vers le champ et les valeurs attendus par Mesures.
            patient_data["disease_type"] = DISEASE_MAPPING.get(disease)

            return PatientSummary.model_validate(patient_data)

        except (ValueError, TypeError) as exc:
            logger.exception(
                "Réponse JSON invalide reçue depuis le service Patients."
            )
            raise DomainError(
                502,
                "reponse_patients_invalide",
                "Le service Patients a renvoyé une réponse inattendue.",
            ) from exc

   


def get_patients_client() -> PatientsClient:
    """Dépendance FastAPI remplaçable dans les tests."""
    return PatientsClient(
        config.PATIENTS_SERVICE_URL,
        config.PATIENTS_SERVICE_TIMEOUT,
    )
