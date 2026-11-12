from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

from app.schemas.mesure import MesureRead
from app.schemas.patient import PatientSummary
from app.schemas.type_mesure import TypeMesureRead

StatutMesure = Literal["a_renseigner", "enregistree"]


class PatientProfil(BaseModel):
    patient: PatientSummary
    fuseau_horaire: str
    date_du_jour: date
    type_principal_id: UUID | None  # mesure affichée sur la courbe


class CarteMesure(BaseModel):
    type_mesure: TypeMesureRead
    statut: StatutMesure
    mesure: MesureRead | None  # la mesure enregistrée aujourd'hui, si elle existe


class ResumeJour(BaseModel):
    date_du_jour: date
    fuseau_horaire: str
    cartes: list[CarteMesure]
    total: int
    enregistrees: int
    restantes: list[str]  # noms des mesures encore à renseigner
    aucune_enregistree: bool
    toutes_enregistrees: bool


class HistoriquePage(BaseModel):
    items: list[MesureRead]  # du plus récent au plus ancien
    total: int
    page: int
    page_size: int
    total_pages: int


class PointCourbe(BaseModel):
    jour: date
    date_mesure: datetime
    valeur: float
    valeur_secondaire: float | None


class CourbeResponse(BaseModel):
    type_mesure: TypeMesureRead
    jours: int
    date_debut: date
    date_fin: date
    points: list[PointCourbe]  # ordre chronologique
    vide: bool  # True : aucune mesure sur la période (aucune donnée inventée)

