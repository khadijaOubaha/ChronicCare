
import os
from dataclasses import dataclass
from uuid import UUID

import httpx
from fastapi import HTTPException

from app.core.security import CurrentUser


PATIENTS_SERVICE_URL = os.getenv(
    "PATIENTS_SERVICE_URL",
    "http://patients-service:8001",
)


@dataclass(frozen=True)
class PatientIdentity:
    patient_id: UUID
    user_id: UUID


def get_authorized_patient(
    current_user: CurrentUser,
    requested_patient_id: UUID | None = None,
) -> PatientIdentity:
    """
    Vérifie l'accès au dossier patient et retourne :
    - patient_id : identifiant du dossier patient
    - user_id : identifiant du compte utilisateur
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

    try:
        response = httpx.get(
            endpoint,
            headers={
                "Authorization": f"Bearer {current_user.token}"
            },
            timeout=5.0,
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Délai dépassé lors de l'appel au service Patients.",
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

    if response.status_code == 401:
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
        patient_data = response.json()
        patient_id = UUID(str(patient_data["id"]))

        raw_user_id = patient_data.get("user_id")
        if raw_user_id is None:
            raise ValueError("Compte utilisateur non associé au patient.")

        user_id = UUID(str(raw_user_id))

    except (ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=502,
            detail="Réponse invalide du service Patients : identifiants manquants ou invalides.",
        )

    if (
        current_user.role == "PATIENT"
        and user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Vous ne pouvez consulter que votre propre dossier.",
        )

    return PatientIdentity(
        patient_id=patient_id,
        user_id=user_id,
    )


def get_authorized_patient_id(
    current_user: CurrentUser,
    requested_patient_id: UUID | None = None,
) -> UUID:
    """
    Conserve la compatibilité avec les anciens appels.
    Retourne uniquement l'identifiant du dossier patient.
    """
    identity = get_authorized_patient(
        current_user,
        requested_patient_id,
    )
    return identity.patient_id
