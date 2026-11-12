"""Logique métier du module Mesures.

Les routeurs restent minces : toutes les règles (types autorisés, une mesure
par jour, validation, jour local...) sont ici.
"""
from datetime import date, timedelta, tzinfo
from math import ceil
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.errors import DomainError
from app.models import MaladieMesure, Mesure, TypeMesure
from app.schemas.dashboard import (
    CarteMesure,
    CourbeResponse,
    HistoriquePage,
    PatientProfil,
    PointCourbe,
    ResumeJour,
)
from app.schemas.mesure import MesureCreate, MesureRead
from app.schemas.patient import PatientSummary
from app.schemas.type_mesure import TypeMesureRead
from app.services.measure_rules import (
    PRIMARY_RULE_CODE_BY_DISEASE,
    get_rule,
    validate_values,
)
from app.services.time_utils import local_date, local_today, to_local, utc_now


# --------------------------------------------------------------------------- #
# Conversions base de données -> schémas de réponse
# --------------------------------------------------------------------------- #
def to_type_read(type_mesure: TypeMesure) -> TypeMesureRead:
    rule = get_rule(type_mesure.nom)
    return TypeMesureRead(
        id=type_mesure.id,
        nom=type_mesure.nom,
        unite=type_mesure.unite,
        description=type_mesure.description,
        code=rule.code,
        deux_valeurs=rule.deux_valeurs,
        libelle_valeur=rule.libelle_valeur,
        libelle_valeur_secondaire=rule.libelle_valeur_secondaire,
        valeur_min=rule.valeur_min,
        valeur_max=rule.valeur_max,
        valeur_secondaire_min=rule.valeur_secondaire_min,
        valeur_secondaire_max=rule.valeur_secondaire_max,
        pas=rule.pas,
    )


def to_mesure_read(mesure: Mesure, type_mesure: TypeMesure, tz: tzinfo) -> MesureRead:
    return MesureRead(
        id=mesure.id,
        patient_id=mesure.patient_id,
        type_mesure_id=mesure.type_mesure_id,
        type_nom=type_mesure.nom,
        unite=type_mesure.unite,
        valeur=mesure.valeur,
        valeur_secondaire=mesure.valeur_secondaire,
        date_mesure=to_local(mesure.date_mesure, tz),
        jour_mesure=mesure.jour_mesure,
        commentaire=mesure.commentaire,
    )


# --------------------------------------------------------------------------- #
# Types de mesures selon la maladie (règle 2)
# --------------------------------------------------------------------------- #
def get_allowed_types(db: Session, disease_type: str) -> list[TypeMesure]:
    """Types associés à la maladie dans `maladie_mesure`, et uniquement ceux-là."""
    statement = (
        select(TypeMesure)
        .join(MaladieMesure, MaladieMesure.type_mesure_id == TypeMesure.id)
        .where(MaladieMesure.disease_type == disease_type)
    )
    types = list(db.scalars(statement).all())
    types.sort(key=lambda t: (get_rule(t.nom).ordre, t.nom))
    return types


def pick_primary_type(types: list[TypeMesure], disease_type: str) -> TypeMesure | None:
    """Mesure la plus représentative de la maladie (pour la courbe)."""
    wanted_code = PRIMARY_RULE_CODE_BY_DISEASE.get(disease_type)
    for type_mesure in types:
        if get_rule(type_mesure.nom).code == wanted_code:
            return type_mesure
    return types[0] if types else None


# --------------------------------------------------------------------------- #
# 1. Profil
# --------------------------------------------------------------------------- #
def get_profil(db: Session, patient: PatientSummary, tz: tzinfo, tz_name: str) -> PatientProfil:
    types = get_allowed_types(db, patient.disease_type)
    principal = pick_primary_type(types, patient.disease_type)
    return PatientProfil(
        patient=patient,
        fuseau_horaire=tz_name,
        date_du_jour=local_today(tz),
        type_principal_id=principal.id if principal else None,
    )


# --------------------------------------------------------------------------- #
# 3. Mesures du jour + statuts
# --------------------------------------------------------------------------- #
def get_today_summary(
    db: Session, patient: PatientSummary, tz: tzinfo, tz_name: str
) -> ResumeJour:
    today = local_today(tz)
    types = get_allowed_types(db, patient.disease_type)

    mesures = db.scalars(
        select(Mesure).where(
            Mesure.patient_id == patient.id, Mesure.jour_mesure == today
        )
    ).all()
    par_type = {m.type_mesure_id: m for m in mesures}

    cartes: list[CarteMesure] = []
    restantes: list[str] = []
    for type_mesure in types:
        mesure = par_type.get(type_mesure.id)
        if mesure is None:
            restantes.append(type_mesure.nom)
        cartes.append(
            CarteMesure(
                type_mesure=to_type_read(type_mesure),
                statut="enregistree" if mesure else "a_renseigner",
                mesure=to_mesure_read(mesure, type_mesure, tz) if mesure else None,
            )
        )

    total = len(cartes)
    enregistrees = total - len(restantes)
    return ResumeJour(
        date_du_jour=today,
        fuseau_horaire=tz_name,
        cartes=cartes,
        total=total,
        enregistrees=enregistrees,
        restantes=restantes,
        aucune_enregistree=enregistrees == 0,
        toutes_enregistrees=total > 0 and enregistrees == total,
    )


# --------------------------------------------------------------------------- #
# 4 + 5. Enregistrement d'une mesure (règles 1, 2, 3 et 4)
# --------------------------------------------------------------------------- #
def _already_recorded(db: Session, patient_id: UUID, type_id: UUID, jour: date) -> bool:
    statement = (
        select(Mesure.id)
        .where(
            Mesure.patient_id == patient_id,
            Mesure.type_mesure_id == type_id,
            Mesure.jour_mesure == jour,
        )
        .limit(1)
    )
    return db.scalar(statement) is not None


def _conflict_error(type_mesure: TypeMesure) -> DomainError:
    return DomainError(
        409,
        "mesure_deja_enregistree",
        f"Vous avez déjà enregistré « {type_mesure.nom} » aujourd'hui. "
        "Une seule mesure par jour est autorisée pour ce type.",
    )


def create_mesure(
    db: Session, patient: PatientSummary, payload: MesureCreate, tz: tzinfo
) -> MesureRead:
    # a) Le patient doit être actif.
    if not patient.is_active:
        raise DomainError(
            403,
            "patient_inactif",
            "Ce compte patient est inactif : il n'est pas possible d'enregistrer "
            "de nouvelles mesures.",
        )

    # b) Le type doit exister...
    type_mesure = db.get(TypeMesure, payload.type_mesure_id)
    if type_mesure is None:
        raise DomainError(404, "type_mesure_introuvable", "Type de mesure introuvable.")

    # c) ... et être associé à la maladie du patient (règle 2).
    allowed_ids = {t.id for t in get_allowed_types(db, patient.disease_type)}
    if type_mesure.id not in allowed_ids:
        raise DomainError(
            400,
            "type_mesure_non_autorise",
            f"« {type_mesure.nom} » n'est pas proposé pour votre suivi.",
        )

    # d) Validation des valeurs selon le type.
    rule = get_rule(type_mesure.nom)
    erreurs = validate_values(rule, payload.valeur, payload.valeur_secondaire, type_mesure.unite)
    if erreurs:
        raise DomainError(422, "valeur_invalide", " ".join(erreurs))

    # e) Date et jour GÉNÉRÉS PAR LE SERVEUR (le patient ne choisit jamais la date).
    maintenant = utc_now()
    jour = local_date(maintenant, tz)

    # f) Une mesure par jour : vérification applicative (message clair)...
    if _already_recorded(db, patient.id, type_mesure.id, jour):
        raise _conflict_error(type_mesure)

    mesure = Mesure(
        patient_id=patient.id,
        type_mesure_id=type_mesure.id,
        valeur=payload.valeur,
        valeur_secondaire=payload.valeur_secondaire,
        date_mesure=maintenant,
        jour_mesure=jour,
        commentaire=payload.commentaire,
    )
    db.add(mesure)
    try:
        db.commit()
    except IntegrityError:
        # ... et garantie par la contrainte unique en base : si deux requêtes
        # simultanées passent le contrôle ci-dessus, une seule peut être insérée.
        db.rollback()
        if _already_recorded(db, patient.id, type_mesure.id, jour):
            raise _conflict_error(type_mesure)
        raise  # autre contrainte (ex. clé étrangère) : erreur 500 générique

    db.refresh(mesure)
    return to_mesure_read(mesure, type_mesure, tz)


# --------------------------------------------------------------------------- #
# 6. Historique
# --------------------------------------------------------------------------- #
def resolve_period(
    jours: int | None, date_debut: date | None, date_fin: date | None, today: date
) -> tuple[date | None, date | None]:
    if jours is not None and (date_debut is not None or date_fin is not None):
        raise DomainError(
            400,
            "periode_invalide",
            "Utilisez soit « jours », soit « date_debut » / « date_fin », pas les deux.",
        )
    if jours is not None:
        return today - timedelta(days=jours - 1), today
    if date_debut and date_fin and date_debut > date_fin:
        raise DomainError(
            400, "periode_invalide", "La date de début doit précéder la date de fin."
        )
    return date_debut, date_fin


def get_history(
    db: Session,
    patient: PatientSummary,
    tz: tzinfo,
    type_mesure_id: UUID | None,
    jours: int | None,
    date_debut: date | None,
    date_fin: date | None,
    page: int,
    page_size: int,
) -> HistoriquePage:
    debut, fin = resolve_period(jours, date_debut, date_fin, local_today(tz))

    filters = [Mesure.patient_id == patient.id]
    if type_mesure_id is not None:
        filters.append(Mesure.type_mesure_id == type_mesure_id)
    if debut is not None:
        filters.append(Mesure.jour_mesure >= debut)
    if fin is not None:
        filters.append(Mesure.jour_mesure <= fin)

    total = db.scalar(select(func.count()).select_from(Mesure).where(*filters)) or 0
    rows = db.execute(
        select(Mesure, TypeMesure)
        .join(TypeMesure, TypeMesure.id == Mesure.type_mesure_id)
        .where(*filters)
        .order_by(Mesure.date_mesure.desc(), Mesure.id)  # plus récent d'abord
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    return HistoriquePage(
        items=[to_mesure_read(m, t, tz) for m, t in rows],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, ceil(total / page_size)),
    )


# --------------------------------------------------------------------------- #
# 7. Données de la courbe
# --------------------------------------------------------------------------- #
def get_chart(
    db: Session,
    patient: PatientSummary,
    tz: tzinfo,
    type_mesure_id: UUID | None,
    jours: int,
) -> CourbeResponse:
    types = get_allowed_types(db, patient.disease_type)
    if not types:
        raise DomainError(
            404, "aucun_type_mesure", "Aucun type de mesure n'est associé à votre suivi."
        )

    if type_mesure_id is None:
        selected = pick_primary_type(types, patient.disease_type)
    else:
        selected = next((t for t in types if t.id == type_mesure_id), None)
        if selected is None:
            raise DomainError(
                400, "type_mesure_non_autorise",
                "Ce type de mesure n'est pas proposé pour votre suivi.",
            )

    fin = local_today(tz)
    debut = fin - timedelta(days=jours - 1)
    mesures = db.scalars(
        select(Mesure)
        .where(
            Mesure.patient_id == patient.id,
            Mesure.type_mesure_id == selected.id,
            Mesure.jour_mesure >= debut,
            Mesure.jour_mesure <= fin,
        )
        .order_by(Mesure.jour_mesure.asc())
    ).all()

    points = [
        PointCourbe(
            jour=m.jour_mesure,
            date_mesure=to_local(m.date_mesure, tz),
            valeur=m.valeur,
            valeur_secondaire=m.valeur_secondaire,
        )
        for m in mesures
    ]
    return CourbeResponse(
        type_mesure=to_type_read(selected),
        jours=jours,
        date_debut=debut,
        date_fin=fin,
        points=points,
        vide=len(points) == 0,
    )
