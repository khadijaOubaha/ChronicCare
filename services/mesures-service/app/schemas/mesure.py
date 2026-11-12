from datetime import date, datetime
from math import isfinite
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MesureCreate(BaseModel):
    """Corps de la requête d'enregistrement d'une mesure.

    - `date_mesure` et `jour_mesure` sont volontairement ABSENTS : ils sont
      générés par le serveur. `extra="forbid"` fait refuser (422) toute requête
      qui tenterait de les envoyer.
    - `patient_id` vient de l'URL, pas du corps.
    """

    model_config = ConfigDict(extra="forbid")

    type_mesure_id: UUID
    valeur: float
    valeur_secondaire: float | None = None
    commentaire: str | None = Field(default=None, max_length=1000)

    @field_validator("valeur", "valeur_secondaire")
    @classmethod
    def refuser_nan_et_infini(cls, value: float | None) -> float | None:
        if value is not None and not isfinite(value):
            raise ValueError("La valeur doit être un nombre fini.")
        return value

    @field_validator("commentaire")
    @classmethod
    def nettoyer_commentaire(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class MesureRead(BaseModel):
    id: UUID
    patient_id: UUID
    type_mesure_id: UUID
    type_nom: str
    unite: str
    valeur: float
    valeur_secondaire: float | None
    date_mesure: datetime  # heure locale (APP_TIMEZONE), avec son décalage
    jour_mesure: date
    commentaire: str | None
