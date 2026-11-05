"""Tests unitaires des règles de validation (schémas Pydantic).

Ce sont les règles de gestion de l'entrée : tailles min/max, UUID valides...
On teste surtout les valeurs LIMITES (0, max, max+1).
"""
import uuid

import pytest
from pydantic import ValidationError

from app.schemas.event import EventCreate
from app.schemas.notification import NotificationCreate

PATIENT_ID = uuid.uuid4()


def notif(**overrides):
    data = {"patient_id": PATIENT_ID, "type": "info", "title": "T", "message": "M"}
    data.update(overrides)
    return NotificationCreate(**data)


# RMD-13 : CAS NORMAL -----------------------------------------------------
def test_notification_valide():
    n = notif()
    assert n.doctor_id is None


# RMD-14 : CAS LIMITES (bornes des champs texte) -------------------------
@pytest.mark.parametrize(
    "champ, taille_max",
    [("type", 50), ("title", 200), ("message", 2000)],
)
def test_notification_borne_haute_acceptee(champ, taille_max):
    n = notif(**{champ: "x" * taille_max})
    assert len(getattr(n, champ)) == taille_max


@pytest.mark.parametrize(
    "champ, taille_max",
    [("type", 50), ("title", 200), ("message", 2000)],
)
def test_notification_depassement_refuse(champ, taille_max):
    with pytest.raises(ValidationError):
        notif(**{champ: "x" * (taille_max + 1)})


@pytest.mark.parametrize("champ", ["type", "title", "message"])
def test_notification_champ_vide_refuse(champ):
    with pytest.raises(ValidationError):
        notif(**{champ: ""})


# RMD-15 : CAS D'ERREUR ---------------------------------------------------
def test_notification_patient_id_invalide_refuse():
    with pytest.raises(ValidationError):
        notif(patient_id="pas-un-uuid")


def test_event_type_vide_refuse():
    with pytest.raises(ValidationError):
        EventCreate(event_type="", patient_id=PATIENT_ID)


def test_event_type_100_caracteres_accepte_101_refuse():
    assert EventCreate(event_type="x" * 100, patient_id=PATIENT_ID)
    with pytest.raises(ValidationError):
        EventCreate(event_type="x" * 101, patient_id=PATIENT_ID)


def test_event_sans_patient_refuse():
    with pytest.raises(ValidationError):
        EventCreate(event_type="measurement.abnormal")


# RMD-16 : valeurs par défaut non partagées entre instances ---------------
def test_event_data_par_defaut_est_independante():
    a = EventCreate(event_type="x", patient_id=PATIENT_ID)
    b = EventCreate(event_type="x", patient_id=PATIENT_ID)
    a.data["cle"] = 1
    assert b.data == {}
