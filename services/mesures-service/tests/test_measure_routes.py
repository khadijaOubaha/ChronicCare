from datetime import date
from uuid import uuid4

from starlette.requests import Request

from app.schemas.patient import PatientSummary
from app.schemas.mesure import MesureCreate
from app.routers import mesures as routes


def make_patient():
    return PatientSummary(
        id=uuid4(),
        first_name="Test",
        last_name="Patient",
        disease_type="diabetes_type_2",
        is_active=True,
    )


def make_request(authorization=None):
    headers = []
    if authorization:
        headers.append(
            (b"authorization", authorization.encode("latin-1"))
        )

    scope = {
        "type": "http",
        "http_version": "1.1",
        "method": "POST",
        "scheme": "http",
        "path": "/",
        "raw_path": b"/",
        "query_string": b"",
        "headers": headers,
        "server": ("testserver", 80),
        "client": ("testclient", 50000),
    }
    return Request(scope)


def test_get_patient_forwards_authorization():
    patient_id = uuid4()
    request = make_request("Bearer test-token")

    class FakeClient:
        def get_patient(self, received_id, authorization):
            assert received_id == patient_id
            assert authorization == "Bearer test-token"
            return "patient-result"

    result = routes.get_patient(patient_id, request, FakeClient())
    assert result == "patient-result"


def test_read_profil(monkeypatch):
    patient = make_patient()
    db = object()
    expected = {"profil": "ok"}

    def fake_get_profil(*args):
        assert args[0] is db
        assert args[1] is patient
        return expected

    monkeypatch.setattr(
        routes.mesure_service, "get_profil", fake_get_profil
    )

    assert routes.read_profil(patient, db) == expected


def test_read_types(monkeypatch):
    patient = make_patient()
    db = object()
    types = [object(), object()]

    monkeypatch.setattr(
        routes.mesure_service, "get_allowed_types",
        lambda received_db, disease: types
    )
    monkeypatch.setattr(
        routes.mesure_service, "to_type_read",
        lambda item: {"type": item}
    )

    result = routes.read_types(patient, db)

    assert len(result) == 2
    assert result[0]["type"] is types[0]


def test_read_today(monkeypatch):
    patient = make_patient()
    db = object()
    expected = {"today": "ok"}

    monkeypatch.setattr(
        routes.mesure_service,
        "get_today_summary",
        lambda *args: expected
    )

    assert routes.read_today(patient, db) == expected


def test_create_mesure_extracts_bearer_token(monkeypatch):
    patient = make_patient()
    db = object()
    payload = MesureCreate(
        type_mesure_id=uuid4(),
        valeur=120
    )
    expected = {"created": True}
    captured = {}

    def fake_create(*args, **kwargs):
        captured["args"] = args
        captured["kwargs"] = kwargs
        return expected

    monkeypatch.setattr(
        routes.mesure_service, "create_mesure", fake_create
    )

    result = routes.create_mesure(
        payload,
        make_request("Bearer abc123"),
        patient,
        db
    )

    assert result == expected
    assert captured["kwargs"]["access_token"] == "abc123"


def test_create_mesure_without_bearer_token(monkeypatch):
    patient = make_patient()
    db = object()
    payload = MesureCreate(
        type_mesure_id=uuid4(),
        valeur=120
    )
    captured = {}

    def fake_create(*args, **kwargs):
        captured.update(kwargs)
        return "created"

    monkeypatch.setattr(
        routes.mesure_service, "create_mesure", fake_create
    )

    result = routes.create_mesure(
        payload,
        make_request("Basic credentials"),
        patient,
        db
    )

    assert result == "created"
    assert captured["access_token"] is None


def test_read_history(monkeypatch):
    patient = make_patient()
    db = object()
    expected = {"history": []}

    def fake_history(*args):
        assert args[0] is db
        assert args[1] is patient
        assert args[7] == 1
        assert args[8] == 20
        return expected

    monkeypatch.setattr(
        routes.mesure_service, "get_history", fake_history
    )

    result = routes.read_history(
        None, 30, None, None, 1, 20, patient, db
    )

    assert result == expected


def test_read_chart(monkeypatch):
    patient = make_patient()
    db = object()
    type_id = uuid4()
    expected = {"chart": []}
    captured = {}

    def fake_chart(*args):
        captured["args"] = args
        return expected

    monkeypatch.setattr(
        routes.mesure_service, "get_chart", fake_chart
    )

    result = routes.read_chart(type_id, 90, patient, db)

    assert result == expected
    assert captured["args"][3] == type_id
    assert captured["args"][4] == 90
