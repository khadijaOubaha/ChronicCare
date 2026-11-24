
import uuid
from unittest.mock import MagicMock, patch

import pytest

from app.schemas.event import EventCreate
from app.schemas.notification import NotificationCreate
from app.services import event_service
from app.services.event_service import (
    EVENT_TEMPLATES,
    UnknownEventType,
    process_event,
)

PATIENT_ID = uuid.uuid4()
PATIENT_USER_ID = uuid.uuid4()
DOCTOR_ID = uuid.uuid4()


def make_event(event_type="measurement.abnormal", **overrides):
    return EventCreate(
        event_type=event_type,
        patient_id=PATIENT_ID,
        **overrides,
    )


@pytest.fixture
def repos():
    with patch.object(event_service, "event_repository") as ev, patch.object(
        event_service, "notification_repository"
    ) as notif:
        ev.create.return_value = MagicMock(id=uuid.uuid4())
        notif.create.return_value = MagicMock(id=uuid.uuid4())
        yield ev, notif


@pytest.fixture
def db():
    return MagicMock()


def test_process_event_cree_une_notification_liee_a_l_evenement(repos, db):
    ev, notif = repos

    event, notification = process_event(
        db,
        make_event(),
        patient_user_id=PATIENT_USER_ID,
    )

    assert event is ev.create.return_value
    assert notification is notif.create.return_value

    kwargs = notif.create.call_args.kwargs
    data = kwargs["data"]

    assert isinstance(data, NotificationCreate)
    assert data.patient_id == PATIENT_ID
    assert data.type == "alert"
    assert data.title == "Mesure à vérifier"
    assert kwargs["patient_user_id"] == PATIENT_USER_ID
    assert kwargs["source_event_id"] == event.id

    db.commit.assert_called_once()
    db.refresh.assert_any_call(event)
    db.refresh.assert_any_call(notification)


@pytest.mark.parametrize("event_type", list(EVENT_TEMPLATES))
def test_chaque_type_connu_utilise_son_gabarit(repos, db, event_type):
    _, notif = repos
    expected_type, expected_title, expected_message = EVENT_TEMPLATES[event_type]

    process_event(
        db,
        make_event(event_type),
        patient_user_id=PATIENT_USER_ID,
    )

    data = notif.create.call_args.kwargs["data"]

    assert (data.type, data.title, data.message) == (
        expected_type,
        expected_title,
        expected_message,
    )


def test_doctor_id_est_propage(repos, db):
    _, notif = repos

    process_event(
        db,
        make_event(doctor_id=DOCTOR_ID),
        patient_user_id=PATIENT_USER_ID,
    )

    assert notif.create.call_args.kwargs["data"].doctor_id == DOCTOR_ID


def test_patient_user_id_est_transmis_au_repository(repos, db):
    _, notif = repos

    process_event(
        db,
        make_event(),
        patient_user_id=PATIENT_USER_ID,
    )

    assert notif.create.call_args.kwargs["patient_user_id"] == PATIENT_USER_ID


def test_evenement_marque_comme_traite(repos, db):
    ev, _ = repos

    process_event(
        db,
        make_event(),
        patient_user_id=PATIENT_USER_ID,
    )

    ev.mark_processed.assert_called_once_with(db, ev.create.return_value)


def test_type_inconnu_leve_une_exception_sans_rien_ecrire(repos, db):
    ev, notif = repos

    with pytest.raises(UnknownEventType):
        process_event(
            db,
            make_event("inconnu.type"),
            patient_user_id=PATIENT_USER_ID,
        )

    ev.create.assert_not_called()
    notif.create.assert_not_called()
    ev.mark_processed.assert_not_called()
    db.commit.assert_not_called()


@pytest.mark.parametrize(
    "event_type",
    [
        "Measurement.Abnormal",
        " measurement.abnormal",
        "measurement.",
    ],
)
def test_type_proche_mais_different_est_refuse(repos, db, event_type):
    with pytest.raises(UnknownEventType):
        process_event(
            db,
            make_event(event_type),
            patient_user_id=PATIENT_USER_ID,
        )

    db.commit.assert_not_called()


def test_si_creation_notification_echoue_transaction_annulee(repos, db):
    ev, notif = repos
    notif.create.side_effect = RuntimeError("base indisponible")

    with pytest.raises(RuntimeError):
        process_event(
            db,
            make_event(),
            patient_user_id=PATIENT_USER_ID,
        )

    ev.mark_processed.assert_not_called()
    db.rollback.assert_called_once()
    db.commit.assert_not_called()