"""Tests unitaires de app/repositories/notification_repository.py.

La session SQLAlchemy est simulée par un MagicMock : on vérifie la logique
(état de l'objet, appels commit/refresh) sans base de données.
"""
import uuid
from datetime import timezone
from unittest.mock import MagicMock

import pytest

from app.models.notification import Notification
from app.repositories import notification_repository as repo
from app.schemas.notification import NotificationCreate


@pytest.fixture
def db():
    return MagicMock()


def make_notification(is_read=False):
    return Notification(
        patient_id=uuid.uuid4(),
        type="info",
        title="Test",
        message="Message",
        is_read=is_read,
        read_at=None,
    )


# RMD-08 : CAS NORMAL ----------------------------------------------------
def test_mark_as_read_met_a_jour_l_etat(db):
    notification = make_notification()

    result = repo.mark_as_read(db, notification)

    assert result.is_read is True
    assert result.read_at is not None
    assert result.read_at.tzinfo == timezone.utc
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(notification)


# RMD-09 : CAS LIMITE (déjà lue : idempotent, pas d'écriture) -------------
def test_mark_as_read_deja_lue_ne_fait_rien(db):
    notification = make_notification(is_read=True)

    repo.mark_as_read(db, notification)

    assert notification.read_at is None  # la date n'est pas écrasée
    db.commit.assert_not_called()


def test_mark_as_read_deux_fois_conserve_la_premiere_date(db):
    notification = make_notification()

    repo.mark_as_read(db, notification)
    premiere_date = notification.read_at
    repo.mark_as_read(db, notification)

    assert notification.read_at == premiere_date
    db.commit.assert_called_once()


# RMD-10 : création avec ou sans événement source -------------------------
def test_create_enregistre_la_notification_avec_source_event_id(db):
    data = NotificationCreate(
        patient_id=uuid.uuid4(), type="alert", title="T", message="M"
    )
    source_id = uuid.uuid4()

    result = repo.create(db, data, source_event_id=source_id)

    assert result.source_event_id == source_id
    assert result.patient_id == data.patient_id
    db.add.assert_called_once_with(result)
    db.commit.assert_called_once()


def test_create_sans_evenement_source_laisse_source_event_id_vide(db):
    data = NotificationCreate(
        patient_id=uuid.uuid4(), type="info", title="T", message="M"
    )

    result = repo.create(db, data)

    assert result.source_event_id is None


# RMD-11 : CAS LIMITE (aucun résultat) ------------------------------------
def test_list_for_patient_sans_resultat_retourne_liste_vide_et_zero(db):
    db.scalar.return_value = None           # COUNT absent
    db.scalars.return_value.all.return_value = []

    items, total = repo.list_for_patient(db, uuid.uuid4(), limit=20, offset=0)

    assert items == []
    assert total == 0


def test_list_for_patient_retourne_items_et_total(db):
    fausses = [make_notification(), make_notification()]
    db.scalar.return_value = 5
    db.scalars.return_value.all.return_value = fausses

    items, total = repo.list_for_patient(db, uuid.uuid4(), limit=2, offset=0)

    assert items == fausses
    assert total == 5


# RMD-12 : recherche d'une notification ----------------------------------
def test_get_delegue_a_la_session(db):
    notification_id = uuid.uuid4()
    db.get.return_value = None

    assert repo.get(db, notification_id) is None
    db.get.assert_called_once_with(Notification, notification_id)
