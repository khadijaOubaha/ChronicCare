"""Règles de validation des mesures, indépendantes de la base de données.

La table `types_mesure` ne contient que nom / unité / description. Les bornes
de validation et le fait qu'une mesure ait une ou deux valeurs (tension) sont
donc définis ici, et reconnus à partir du NOM du type (sans accents ni casse).

Ce module n'utilise que la bibliothèque standard : il est facile à tester.

Les bornes sont volontairement LARGES : elles servent à détecter les fautes de
frappe (ex. 1200 au lieu de 120), pas à poser un diagnostic médical.
"""
import unicodedata
from dataclasses import dataclass

# Mesure affichée en priorité sur la courbe, selon la maladie.
PRIMARY_RULE_CODE_BY_DISEASE: dict[str, str] = {
    "diabetes_type_2": "glycemie",
    "hypertension": "tension_arterielle",
}


@dataclass(frozen=True)
class MesureRule:
    code: str
    ordre: int  # ordre d'affichage des cartes
    deux_valeurs: bool
    libelle_valeur: str
    libelle_valeur_secondaire: str | None
    valeur_min: float
    valeur_max: float
    valeur_secondaire_min: float | None
    valeur_secondaire_max: float | None
    pas: float  # pas de saisie conseillé pour le champ HTML


def normalize_name(nom: str) -> str:
    """'  Tension Artérielle ' -> 'tension arterielle' (pour comparer sans piège)."""
    sans_accents = (
        unicodedata.normalize("NFKD", nom).encode("ascii", "ignore").decode("ascii")
    )
    return " ".join(sans_accents.lower().split())


_RULES: dict[str, MesureRule] = {
    "glycemie": MesureRule(
        code="glycemie", ordre=1, deux_valeurs=False,
        libelle_valeur="Valeur", libelle_valeur_secondaire=None,
        valeur_min=20, valeur_max=600,
        valeur_secondaire_min=None, valeur_secondaire_max=None, pas=1,
    ),
    "poids": MesureRule(
        code="poids", ordre=2, deux_valeurs=False,
        libelle_valeur="Valeur", libelle_valeur_secondaire=None,
        valeur_min=20, valeur_max=300,
        valeur_secondaire_min=None, valeur_secondaire_max=None, pas=0.1,
    ),
    "tension arterielle": MesureRule(
        code="tension_arterielle", ordre=3, deux_valeurs=True,
        libelle_valeur="Pression systolique",
        libelle_valeur_secondaire="Pression diastolique",
        valeur_min=50, valeur_max=260,
        valeur_secondaire_min=30, valeur_secondaire_max=160, pas=1,
    ),
    "frequence cardiaque": MesureRule(
        code="frequence_cardiaque", ordre=4, deux_valeurs=False,
        libelle_valeur="Valeur", libelle_valeur_secondaire=None,
        valeur_min=20, valeur_max=250,
        valeur_secondaire_min=None, valeur_secondaire_max=None, pas=1,
    ),
    "temperature corporelle": MesureRule(
        code="temperature_corporelle", ordre=5, deux_valeurs=False,
        libelle_valeur="Valeur", libelle_valeur_secondaire=None,
        valeur_min=30, valeur_max=45,
        valeur_secondaire_min=None, valeur_secondaire_max=None, pas=0.1,
    ),
}

# Règle de secours pour un type ajouté plus tard en base sans règle dédiée :
# une seule valeur positive.
_GENERIC_RULE = MesureRule(
    code="generique", ordre=99, deux_valeurs=False,
    libelle_valeur="Valeur", libelle_valeur_secondaire=None,
    valeur_min=0, valeur_max=1_000_000,
    valeur_secondaire_min=None, valeur_secondaire_max=None, pas=0.1,
)


def get_rule(nom_type: str) -> MesureRule:
    """Retourne la règle d'un type de mesure à partir de son nom."""
    return _RULES.get(normalize_name(nom_type), _GENERIC_RULE)


def _fmt(nombre: float) -> str:
    return f"{nombre:g}"


def validate_values(
    rule: MesureRule,
    valeur: float,
    valeur_secondaire: float | None,
    unite: str = "",
) -> list[str]:
    """Valide les valeurs saisies. Retourne la liste des erreurs (vide = OK)."""
    suffixe = f" {unite}" if unite else ""
    erreurs: list[str] = []

    if not rule.valeur_min <= valeur <= rule.valeur_max:
        erreurs.append(
            f"{rule.libelle_valeur} : elle doit être comprise entre "
            f"{_fmt(rule.valeur_min)} et {_fmt(rule.valeur_max)}{suffixe}."
        )

    if rule.deux_valeurs:
        if valeur_secondaire is None:
            erreurs.append(f"{rule.libelle_valeur_secondaire} : valeur obligatoire.")
        elif not (
            rule.valeur_secondaire_min <= valeur_secondaire <= rule.valeur_secondaire_max
        ):
            erreurs.append(
                f"{rule.libelle_valeur_secondaire} : elle doit être comprise entre "
                f"{_fmt(rule.valeur_secondaire_min)} et "
                f"{_fmt(rule.valeur_secondaire_max)}{suffixe}."
            )
        elif valeur <= valeur_secondaire:
            erreurs.append(
                "La pression systolique doit être supérieure à la pression diastolique."
            )
    elif valeur_secondaire is not None:
        erreurs.append("Ce type de mesure n'accepte qu'une seule valeur.")

    return erreurs
