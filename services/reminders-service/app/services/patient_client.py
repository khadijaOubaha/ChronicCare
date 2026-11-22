

import os
from uuid import UUID

import httpx
from fastapi import HTTPException

from app.core.security import CurrentUser


PATIENTS_SERVICE_URL = os.getenv(
    "PATIENTS_SERVICE_URL",
    "http://patients-service:8001",
)


def get_authorized_patient_id(
    current_user: CurrentUser,
    requested_patient_id: UUID | None = None,
) -> UUID:
    """
    Vérifie l'accès au dossier patient via le service Patients
    et retourne son véritable patient_id.
    """

    if current_user.role == "PATIENT":
        endpoint = f"{PATIENTS_SERVICE_URL}/api/v1/patients/me"

    elif current_user.role == "ADMIN":
        if requested_patient_id is None:
            raise HTTPException(
                status_code=400,
                detail="patient_id requis pour un administrateur.",
            )

        endpoint = (
            f"{PATIENTS_SERVICE_URL}/api/v1/patients/"
            f"{requested_patient_id}"
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="Accès non autorisé.",
        )

    headers = {
        "Authorization": f"Bearer {current_user.token}"
    }

    try:
        response = httpx.get(
            endpoint,
            headers=headers,
            timeout=5.0,
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Service Patients temporairement indisponible.",
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Dossier patient introuvable.",
        )

    if response.status_code == 403:
        raise HTTPException(
            status_code=403,
            detail="Accès interdit à ce dossier patient.",
        )

    if response.status_code in (401,):
        raise HTTPException(
            status_code=401,
            detail="Authentification refusée par Patients.",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=503,
            detail="Impossible de vérifier le dossier patient.",
        )

    try:
        patient_id = UUID(response.json()["id"])
    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Réponse invalide du service Patients.",
        )

    if (
        current_user.role == "PATIENT"
        and requested_patient_id is not None
        and patient_id != requested_patient_id
    ):
        raise HTTPException(
            status_code=403,
            detail="Vous ne pouvez consulter que vos propres notifications.",
        )

    return patient_id
