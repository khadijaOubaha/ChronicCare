"""Routes du module Mesures.

Volontairement : GET (consultation) et un seul POST (enregistrement).
Aucune route PUT / PATCH / DELETE : une mesure enregistrée est définitive.
"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app import config
from app.database import get_db
from app.schemas.dashboard import (
    CourbeResponse,
    HistoriquePage,
    PatientProfil,
    ResumeJour,
)
from app.schemas.mesure import MesureCreate, MesureRead
from app.schemas.patient import PatientSummary
from app.schemas.type_mesure import TypeMesureRead
from app.services import mesure_service
from app.services.patients_client import PatientsClient, get_patients_client

router = APIRouter(prefix="/api/v1/patients/{patient_id}/mesures", tags=["Mesures"])


def get_patient(
    patient_id: UUID, client: PatientsClient = Depends(get_patients_client)
) -> PatientSummary:
    """Récupère le patient via l'API du service Patients (404 s'il n'existe pas)."""
    return client.get_patient(patient_id)


_ERREURS_PATIENT = {
    404: {"description": "Patient introuvable"},
    502: {"description": "Réponse invalide du service Patients"},
    503: {"description": "Service Patients indisponible"},
}


@router.get("/profil", response_model=PatientProfil, responses=_ERREURS_PATIENT)
def read_profil(
    patient: PatientSummary = Depends(get_patient), db: Session = Depends(get_db)
):
    """Informations du patient, type de maladie et mesure principale de la courbe."""
    return mesure_service.get_profil(
        db, patient, config.APP_TIMEZONE, config.APP_TIMEZONE_NAME
    )


@router.get("/types", response_model=list[TypeMesureRead], responses=_ERREURS_PATIENT)
def read_types(
    patient: PatientSummary = Depends(get_patient), db: Session = Depends(get_db)
):
    """Types de mesures associés à la maladie du patient (et eux seuls)."""
    return [
        mesure_service.to_type_read(t)
        for t in mesure_service.get_allowed_types(db, patient.disease_type)
    ]


@router.get("/aujourdhui", response_model=ResumeJour, responses=_ERREURS_PATIENT)
def read_today(
    patient: PatientSummary = Depends(get_patient), db: Session = Depends(get_db)
):
    """Cartes du jour : statut de chaque mesure (à renseigner / enregistrée)."""
    return mesure_service.get_today_summary(
        db, patient, config.APP_TIMEZONE, config.APP_TIMEZONE_NAME
    )


@router.post(
    "",
    response_model=MesureRead,
    status_code=status.HTTP_201_CREATED,
    responses={
        **_ERREURS_PATIENT,
        400: {"description": "Type de mesure non proposé pour ce patient"},
        403: {"description": "Patient inactif"},
        409: {"description": "Mesure déjà enregistrée aujourd'hui pour ce type"},
        422: {"description": "Valeurs invalides"},
    },
)
def create_mesure(
    payload: MesureCreate,
    patient: PatientSummary = Depends(get_patient),
    db: Session = Depends(get_db),
):
    """Enregistre une mesure. La date est générée par le serveur."""
    return mesure_service.create_mesure(db, patient, payload, config.APP_TIMEZONE)


@router.get("/historique", response_model=HistoriquePage, responses=_ERREURS_PATIENT)
def read_history(
    type_mesure_id: UUID | None = Query(default=None, description="Filtrer par type"),
    jours: int | None = Query(default=None, ge=1, le=3650, description="Les N derniers jours"),
    date_debut: date | None = Query(default=None, description="Jour local (AAAA-MM-JJ)"),
    date_fin: date | None = Query(default=None, description="Jour local (AAAA-MM-JJ)"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    patient: PatientSummary = Depends(get_patient),
    db: Session = Depends(get_db),
):
    """Historique paginé, du plus récent au plus ancien."""
    return mesure_service.get_history(
        db, patient, config.APP_TIMEZONE,
        type_mesure_id, jours, date_debut, date_fin, page, page_size,
    )


@router.get("/courbe", response_model=CourbeResponse, responses=_ERREURS_PATIENT)
def read_chart(
    type_mesure_id: UUID | None = Query(
        default=None, description="Par défaut : la mesure principale de la maladie"
    ),
    jours: int = Query(default=30, ge=1, le=365, description="7, 30 ou 90 en pratique"),
    patient: PatientSummary = Depends(get_patient),
    db: Session = Depends(get_db),
):
    """Points de la courbe d'évolution (ordre chronologique, valeurs réelles uniquement)."""
    return mesure_service.get_chart(
        db, patient, config.APP_TIMEZONE, type_mesure_id, jours
    )
