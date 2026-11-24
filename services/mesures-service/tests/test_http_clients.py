from uuid import uuid4
from types import SimpleNamespace

import httpx
import pytest

from app.errors import DomainError
from app.services.patients_client import PatientsClient
from app.services.reminders_client import RemindersClient


def patient_data(disease="TYPE_2_DIABETES"):
    return {
        "id": str(uuid4()),
        "first_name": "Test",
        "last_name": "Patient",
        "disease": disease,
        "is_active": True,
    }


def test_patients_client_success_maps_diabetes(monkeypatch):
    data = patient_data()

    monkeypatch.setattr(
        "app.services.patients_client.httpx.get",
        lambda *args, **kwargs: SimpleNamespace(
            status_code=200,
            json=lambda: data.copy()
        )
    )

    result = PatientsClient("http://patients", 3).get_patient(uuid4())

    assert result.disease_type == "diabetes_type_2"
    assert result.is_active is True


def test_patients_client_success_maps_hypertension(monkeypatch):
    data = patient_data("HYPERTENSION")

    monkeypatch.setattr(
        "app.services.patients_client.httpx.get",
        lambda *args, **kwargs: SimpleNamespace(
            status_code=200,
            json=lambda: data.copy()
        )
    )

    result = PatientsClient("http://patients", 3).get_patient(uuid4())

    assert result.disease_type == "hypertension"


def test_patients_client_forwards_authorization(monkeypatch):
    captured = {}

    def fake_get(url, headers, timeout):
        captured["headers"] = headers
        return SimpleNamespace(
            status_code=200,
            json=lambda: patient_data()
        )

    monkeypatch.setattr("app.services.patients_client.httpx.get", fake_get)

    PatientsClient("http://patients", 3).get_patient(
        uuid4(), "Bearer test-token"
    )

    assert captured["headers"]["Authorization"] == "Bearer test-token"


def test_patients_client_without_authorization(monkeypatch):
    captured = {}

    def fake_get(url, headers, timeout):
        captured["headers"] = headers
        return SimpleNamespace(status_code=404)

    monkeypatch.setattr("app.services.patients_client.httpx.get", fake_get)

    with pytest.raises(DomainError):
        PatientsClient("http://patients", 3).get_patient(uuid4())

    assert "Authorization" not in captured["headers"]


def test_patients_client_patient_not_found(monkeypatch):
    monkeypatch.setattr(
        "app.services.patients_client.httpx.get",
        lambda *args, **kwargs: SimpleNamespace(status_code=404)
    )

    with pytest.raises(DomainError) as exc:
        PatientsClient("http://patients", 3).get_patient(uuid4())

    assert exc.value.code == "patient_introuvable"


def test_patients_client_server_error(monkeypatch):
    monkeypatch.setattr(
        "app.services.patients_client.httpx.get",
        lambda *args, **kwargs: SimpleNamespace(status_code=500)
    )

    with pytest.raises(DomainError) as exc:
        PatientsClient("http://patients", 3).get_patient(uuid4())

    assert exc.value.code == "reponse_patients_invalide"


def test_patients_client_connection_error(monkeypatch):
    def fake_get(*args, **kwargs):
        raise httpx.ConnectError("Connection failed")

    monkeypatch.setattr("app.services.patients_client.httpx.get", fake_get)

    with pytest.raises(DomainError) as exc:
        PatientsClient("http://patients", 3).get_patient(uuid4())

    assert exc.value.code == "service_patients_indisponible"


def test_patients_client_invalid_json_data(monkeypatch):
    monkeypatch.setattr(
        "app.services.patients_client.httpx.get",
        lambda *args, **kwargs: SimpleNamespace(
            status_code=200,
            json=lambda: {"invalid": "data"}
        )
    )

    with pytest.raises(DomainError) as exc:
        PatientsClient("http://patients", 3).get_patient(uuid4())

    assert exc.value.code == "reponse_patients_invalide"


def test_reminders_client_success(monkeypatch):
    captured = {}

    def fake_post(url, json, headers, timeout):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        return SimpleNamespace(raise_for_status=lambda: None)

    monkeypatch.setattr("app.services.reminders_client.httpx.post", fake_post)

    client = RemindersClient()
    event = {"event_id": "event-123", "type": "measurement.abnormal"}

    result = client.send_abnormal_measurement(event, "test-token")

    assert result is True
    assert captured["url"].endswith("/api/v1/events")
    assert captured["json"] == event
    assert captured["headers"]["Authorization"] == "Bearer test-token"


def test_reminders_client_returns_false_on_connection_error(monkeypatch):
    def fake_post(*args, **kwargs):
        raise httpx.ConnectError("Connection failed")

    monkeypatch.setattr("app.services.reminders_client.httpx.post", fake_post)

    result = RemindersClient().send_abnormal_measurement(
        {"event_id": "event-123"}, "test-token"
    )

    assert result is False


def test_reminders_client_returns_false_on_http_error(monkeypatch):
    def fake_post(*args, **kwargs):
        request = httpx.Request("POST", "http://reminders/api/v1/events")
        response = httpx.Response(500, request=request)
        raise httpx.HTTPStatusError(
            "Server error", request=request, response=response
        )

    monkeypatch.setattr("app.services.reminders_client.httpx.post", fake_post)

    result = RemindersClient().send_abnormal_measurement(
        {"event_id": "event-123"}, "test-token"
    )

    assert result is False
