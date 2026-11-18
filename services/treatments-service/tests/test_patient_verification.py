
import httpx
import pytest
from types import SimpleNamespace
from uuid import uuid4

from fastapi import HTTPException

from app.routers.treatments import verify_patient


def test_verify_patient_success(monkeypatch):
    def fake_get(*args, **kwargs):
        return SimpleNamespace(
            status_code=200,
            json=lambda: {"is_active": True},
        )

    monkeypatch.setattr(
        "app.routers.treatments.httpx.get",
        fake_get,
    )

    verify_patient(uuid4())


def test_verify_patient_not_found(monkeypatch):
    def fake_get(*args, **kwargs):
        return SimpleNamespace(status_code=404)

    monkeypatch.setattr(
        "app.routers.treatments.httpx.get",
        fake_get,
    )

    with pytest.raises(HTTPException) as exc:
        verify_patient(uuid4())

    assert exc.value.status_code == 404


def test_verify_inactive_patient(monkeypatch):
    def fake_get(*args, **kwargs):
        return SimpleNamespace(
            status_code=200,
            json=lambda: {"is_active": False},
        )

    monkeypatch.setattr(
        "app.routers.treatments.httpx.get",
        fake_get,
    )

    with pytest.raises(HTTPException) as exc:
        verify_patient(uuid4())

    assert exc.value.status_code == 409


def test_patients_service_unavailable(monkeypatch):
    def fake_get(*args, **kwargs):
        request = httpx.Request(
            "GET",
            "http://patients-service:8001/api/v1/patients",
        )
        raise httpx.ConnectError(
            "Service indisponible",
            request=request,
        )

    monkeypatch.setattr(
        "app.routers.treatments.httpx.get",
        fake_get,
    )

    with pytest.raises(HTTPException) as exc:
        verify_patient(uuid4())

    assert exc.value.status_code == 503


def test_patients_service_server_error(monkeypatch):
    def fake_get(*args, **kwargs):
        return SimpleNamespace(status_code=500)

    monkeypatch.setattr(
        "app.routers.treatments.httpx.get",
        fake_get,
    )

    with pytest.raises(HTTPException) as exc:
        verify_patient(uuid4())

    assert exc.value.status_code == 502


def test_patients_service_invalid_json(monkeypatch):
    def fake_get(*args, **kwargs):
        def invalid_json():
            raise ValueError("Invalid JSON")

        return SimpleNamespace(
            status_code=200,
            json=invalid_json,
        )

    monkeypatch.setattr(
        "app.routers.treatments.httpx.get",
        fake_get,
    )

    with pytest.raises(HTTPException) as exc:
        verify_patient(uuid4())

    assert exc.value.status_code == 502
