from datetime import datetime, date, timezone
from types import SimpleNamespace
from uuid import uuid4
from zoneinfo import ZoneInfo

import pytest

from app.errors import DomainError
from app.schemas.mesure import MesureCreate
from app.schemas.patient import PatientSummary
from app.services import mesure_service as service


def make_patient(active=True):
    return PatientSummary(
        id=uuid4(),
        first_name="Test",
        last_name="Patient",
        disease_type="diabetes_type_2",
        is_active=active,
    )


def make_type():
    return SimpleNamespace(
        id=uuid4(),
        nom="Glycémie",
        unite="mg/dL",
        description="Test"
    )


def make_payload(type_id):
    return MesureCreate(type_mesure_id=type_id, valeur=120)


def setup_create(monkeypatch, patient, type_mesure):
    db = SimpleNamespace(
        get=lambda *args: type_mesure,
        add=lambda item: None,
        commit=lambda: None,
        refresh=lambda item: None,
        rollback=lambda: None,
    )

    monkeypatch.setattr(
        service, "get_allowed_types",
        lambda *args: [type_mesure]
    )
    monkeypatch.setattr(
        service, "_already_recorded",
        lambda *args: False
    )
    monkeypatch.setattr(
        service, "utc_now",
        lambda: datetime(2026, 11, 24, 12, 0, tzinfo=timezone.utc)
    )
    monkeypatch.setattr(
        service, "local_date",
        lambda value, tz: date(2026, 11, 24)
    )
    monkeypatch.setattr(
        service, "detect_anomalies",
        lambda **kwargs: []
    )
    monkeypatch.setattr(
        service, "to_mesure_read",
        lambda mesure, typ, tz: {"created": True, "value": mesure.valeur}
    )

    return db


def test_create_mesure_rejects_inactive_patient(monkeypatch):
    patient = make_patient(active=False)
    typ = make_type()
    db = setup_create(monkeypatch, patient, typ)

    with pytest.raises(DomainError) as exc:
        service.create_mesure(
            db, patient, make_payload(typ.id),
            ZoneInfo("Africa/Casablanca")
        )

    assert exc.value.code == "patient_inactif"


def test_create_mesure_rejects_unknown_type(monkeypatch):
    patient = make_patient()
    db = setup_create(monkeypatch, patient, None)

    with pytest.raises(DomainError) as exc:
        service.create_mesure(
            db, patient, make_payload(uuid4()),
            ZoneInfo("Africa/Casablanca")
        )

    assert exc.value.code == "type_mesure_introuvable"


def test_create_mesure_rejects_unauthorized_type(monkeypatch):
    patient = make_patient()
    typ = make_type()
    other_type = make_type()
    db = setup_create(monkeypatch, patient, typ)

    monkeypatch.setattr(
        service, "get_allowed_types",
        lambda *args: [other_type]
    )

    with pytest.raises(DomainError) as exc:
        service.create_mesure(
            db, patient, make_payload(typ.id),
            ZoneInfo("Africa/Casablanca")
        )

    assert exc.value.code == "type_mesure_non_autorise"


def test_create_mesure_rejects_invalid_value(monkeypatch):
    patient = make_patient()
    typ = make_type()
    db = setup_create(monkeypatch, patient, typ)

    payload = MesureCreate(type_mesure_id=typ.id, valeur=10)

    with pytest.raises(DomainError) as exc:
        service.create_mesure(
            db, patient, payload,
            ZoneInfo("Africa/Casablanca")
        )

    assert exc.value.code == "valeur_invalide"


def test_create_mesure_rejects_duplicate(monkeypatch):
    patient = make_patient()
    typ = make_type()
    db = setup_create(monkeypatch, patient, typ)

    monkeypatch.setattr(
        service, "_already_recorded",
        lambda *args: True
    )

    with pytest.raises(DomainError) as exc:
        service.create_mesure(
            db, patient, make_payload(typ.id),
            ZoneInfo("Africa/Casablanca")
        )

    assert exc.value.code == "mesure_deja_enregistree"


def test_create_mesure_success(monkeypatch):
    patient = make_patient()
    typ = make_type()
    db = setup_create(monkeypatch, patient, typ)

    result = service.create_mesure(
        db,
        patient,
        make_payload(typ.id),
        ZoneInfo("Africa/Casablanca"),
        access_token="test-token"
    )

    assert result["created"] is True
    assert result["value"] == 120
