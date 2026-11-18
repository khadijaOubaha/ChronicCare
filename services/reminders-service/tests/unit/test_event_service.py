"""Tests unitaires de app/services/event_service.py (logique métier).

Les repositories sont remplacés par des mocks : aucune base de données,
aucun serveur HTTP. C'est l'équivalent de Mockito en Java.
"""
import uuid
from unittest.mock import MagicMock, patch

import pytest

from app.schemas.event import EventCreate
from app.schemas.notification import NotificationCreate
from app.services import event_service
from app.services.event_service import EVENT_TEMPLATES, UnknownEventType, process_event

PATIENT_ID = uuid.uuid4()
DOCTOR_ID = uuid.uuid4()


def make_event(event_type="measurement.abnormal", **overrides):
    return EventCreate(event_type=event_type, patient_id=PATIENT_ID, **overrides)


@pytest.fixture
def repos():
    """Remplace event_repository et notification_repository par des mocks."""
    with patch.object(event_service, "event_repository") as ev, patch.object(
        event_service, "notification_repository"
    ) as notif:
        ev.create.return_value = MagicMock(id=uuid.uuid4())
        notif.create.return_value = MagicMock(id=uuid.uuid4())
        yield ev, notif


@pytest.fixture
def db():
    return MagicMock()  # fausse session SQLAlchemy


# RMD-01 : CAS NORMAL -----------------------------------------------------
def test_process_event_cree_une_notification_liee_a_l_evenement(repos, db):
    ev, notif = repos

    event, notification = process_event(db, make_event())

    assert event is ev.create.return_value
    assert notification is notif.create.return_value
    args, kwargs = notif.create.call_args
    data = args[1]
    assert isinstance(data, NotificationCreate)
    assert data.patient_id == PATIENT_ID
    assert data.type == "alert"
    assert data.title == "Mesure à vérifier"
    assert kwargs["source_event_id"] == ev.create.return_value.id


# RMD-02 : chaque type connu produit le bon gabarit ----------------------
@pytest.mark.parametrize("event_type", list(EVENT_TEMPLATES))
def test_chaque_type_connu_utilise_son_gabarit(repos, db, event_type):
    _, notif = repos
    expected_type, expected_title, expected_message = EVENT_TEMPLATES[event_type]

    process_event(db, make_event(event_type))

    data = notif.create.call_args.args[1]
    assert (data.type, data.title, data.message) == (
        expected_type,
        expected_title,
        expected_message,
    )


# RMD-03 : le médecin est transmis à la notification ----------------------
def test_doctor_id_est_propage(repos, db):
    _, notif = repos

    process_event(db, make_event(doctor_id=DOCTOR_ID))

    assert notif.create.call_args.args[1].doctor_id == DOCTOR_ID


# RMD-04 : l'événement est marqué traité --------------------------------
def test_evenement_marque_comme_traite(repos, db):
    ev, _ = repos

    process_event(db, make_event())

    ev.mark_processed.assert_called_once_with(db, ev.create.return_value)


# RMD-05 : CAS D'ERREUR (type inconnu) ----------------------------------
def test_type_inconnu_leve_une_exception_sans_rien_ecrire(repos, db):
    ev, notif = repos

    with pytest.raises(UnknownEventType):
        process_event(db, make_event("inconnu.type"))

    ev.create.assert_not_called()
    notif.create.assert_not_called()
    ev.mark_processed.assert_not_called()


# RMD-06 : CAS LIMITE (le type est sensible à la casse) ------------------
@pytest.mark.parametrize("event_type", ["Measurement.Abnormal", " measurement.abnormal", "measurement."])
def test_type_proche_mais_different_est_refuse(repos, db, event_type):
    with pytest.raises(UnknownEventType):
        process_event(db, make_event(event_type))


# RMD-07 : CAS D'ERREUR (échec en cours de traitement) -------------------
def test_si_creation_notification_echoue_evenement_non_marque_traite(repos, db):
    ev, notif = repos
    notif.create.side_effect = RuntimeError("base indisponible")

    with pytest.raises(RuntimeError):
        process_event(db, make_event())

    ev.mark_processed.assert_not_called()
