
import uuid
from datetime import timezone
from unittest.mock import MagicMock

import pytest

from app.models.notification import Notification
from app.models.notification_recipient import NotificationRecipient
from app.repositories import notification_repository as repo
from app.schemas.notification import NotificationCreate


PATIENT_USER_ID = uuid.uuid4()
DOCTOR_ID = uuid.uuid4()


@pytest.fixture
def db():
    session = MagicMock()

    def fake_flush():
        # Simule l'attribution de l'UUID par SQLAlchemy après insertion.
        for call in session.add.call_args_list:
            obj = call.args[0]
            if isinstance(obj, Notification) and obj.id is None:
                obj.id = uuid.uuid4()

    session.flush.side_effect = fake_flush
    return session


def make_notification(is_read=False):
    return Notification(
        patient_id=uuid.uuid4(),
        type="info",
        title="Test",
        message="Message",
        is_read=is_read,
        read_at=None,
    )


def make_recipient(is_read=False):
    return NotificationRecipient(
        notification_id=uuid.uuid4(),
        user_id=PATIENT_USER_ID,
        role="PATIENT",
        is_read=is_read,
        read_at=None,
    )


def test_mark_as_read_met_a_jour_l_etat(db):
    recipient = make_recipient()
    db.scalar.return_value = recipient

    result = repo.mark_as_read(
        db,
        recipient.notification_id,
        PATIENT_USER_ID,
        "PATIENT",
    )

    assert result is recipient
    assert result.is_read is True
    assert result.read_at is not None
    assert result.read_at.tzinfo == timezone.utc
    db.flush.assert_called_once()
    db.commit.assert_not_called()


def test_mark_as_read_deja_lue_ne_fait_rien(db):
    recipient = make_recipient(is_read=True)
    original_date = recipient.read_at
    db.scalar.return_value = recipient

    result = repo.mark_as_read(
        db,
        recipient.notification_id,
        PATIENT_USER_ID,
        "PATIENT",
    )

    assert result.is_read is True
    assert result.read_at == original_date
    db.flush.assert_not_called()


def test_mark_as_read_deux_fois_conserve_la_premiere_date(db):
    recipient = make_recipient()
    db.scalar.return_value = recipient

    repo.mark_as_read(
        db,
        recipient.notification_id,
        PATIENT_USER_ID,
        "PATIENT",
    )
    first_date = recipient.read_at

    repo.mark_as_read(
        db,
        recipient.notification_id,
        PATIENT_USER_ID,
        "PATIENT",
    )

    assert recipient.read_at == first_date
    assert recipient.is_read is True


def test_mark_as_read_refuse_un_autre_destinataire(db):
    db.scalar.return_value = None

    result = repo.mark_as_read(
        db,
        uuid.uuid4(),
        PATIENT_USER_ID,
        "PATIENT",
    )

    assert result is None


def test_create_enregistre_notification_et_deux_destinataires(db):
    data = NotificationCreate(
        patient_id=uuid.uuid4(),
        doctor_id=DOCTOR_ID,
        type="alert",
        title="T",
        message="M",
    )
    source_id = uuid.uuid4()

    result = repo.create(
        db,
        data,
        patient_user_id=PATIENT_USER_ID,
        source_event_id=source_id,
    )

    assert result.source_event_id == source_id
    assert result.patient_id == data.patient_id

    added_objects = [call.args[0] for call in db.add.call_args_list]

    assert len(added_objects) == 3
    assert isinstance(added_objects[0], Notification)

    recipients = [
        obj for obj in added_objects
        if isinstance(obj, NotificationRecipient)
    ]

    assert len(recipients) == 2
    assert any(
        r.user_id == PATIENT_USER_ID and r.role == "PATIENT"
        for r in recipients
    )
    assert any(
        r.user_id == DOCTOR_ID and r.role == "ADMIN"
        for r in recipients
    )

    db.commit.assert_not_called()


def test_create_sans_medecin_cree_un_seul_destinataire(db):
    data = NotificationCreate(
        patient_id=uuid.uuid4(),
        doctor_id=None,
        type="info",
        title="T",
        message="M",
    )

    repo.create(
        db,
        data,
        patient_user_id=PATIENT_USER_ID,
    )

    recipients = [
        call.args[0]
        for call in db.add.call_args_list
        if isinstance(call.args[0], NotificationRecipient)
    ]

    assert len(recipients) == 1
    assert recipients[0].user_id == PATIENT_USER_ID
    assert recipients[0].role == "PATIENT"


def test_list_for_patient_sans_resultat_retourne_liste_vide_et_zero(db):
    db.scalar.return_value = None
    db.scalars.return_value.all.return_value = []

    items, total = repo.list_for_patient(
        db,
        PATIENT_USER_ID,
        limit=20,
        offset=0,
    )

    assert items == []
    assert total == 0


def test_list_for_patient_retourne_items_et_total(db):
    notifications = [make_notification(), make_notification()]
    db.scalar.return_value = 5
    db.scalars.return_value.all.return_value = notifications

    items, total = repo.list_for_patient(
        db,
        PATIENT_USER_ID,
        limit=2,
        offset=0,
    )

    assert items == notifications
    assert total == 5


def test_list_for_doctor_utilise_le_role_admin(db):
    db.scalar.return_value = 0
    db.scalars.return_value.all.return_value = []

    items, total = repo.list_for_doctor(
        db,
        DOCTOR_ID,
        limit=20,
        offset=0,
    )

    assert items == []
    assert total == 0


def test_get_delegue_a_la_session(db):
    notification_id = uuid.uuid4()
    db.get.return_value = None

    assert repo.get(db, notification_id) is None
    db.get.assert_called_once_with(Notification, notification_id)