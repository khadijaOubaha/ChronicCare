from uuid import UUID

from pydantic import BaseModel


class TypeMesureRead(BaseModel):
    """Un type de mesure + les règles de saisie, pour que le frontend adapte le
    formulaire (1 ou 2 champs, bornes, pas) sans rien coder en dur."""

    id: UUID
    nom: str
    unite: str
    description: str | None
    code: str  # ex. "glycemie", "tension_arterielle"
    deux_valeurs: bool
    libelle_valeur: str
    libelle_valeur_secondaire: str | None
    valeur_min: float
    valeur_max: float
    valeur_secondaire_min: float | None
    valeur_secondaire_max: float | None
    pas: float
