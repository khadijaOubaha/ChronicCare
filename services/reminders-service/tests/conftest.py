

import uuid

import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401
from app.core.database import Base, get_db
from app.main import app


PATIENT_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
PATIENT_USER_ID = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv(
        "JWT_SECRET_KEY",
        "chroniccare-test-secret-key-32-bytes-minimum",
    )

    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False)

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)

    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def mock_patients_service(monkeypatch):
    class FakeResponse:
        status_code = 200

        def __init__(self, patient_id):
            self.patient_id = uuid.UUID(str(patient_id))

        def json(self):
            return {
                "id": str(self.patient_id),
                "user_id": str(PATIENT_USER_ID),
            }

    def fake_get(url, headers=None, timeout=None):
        if url.rstrip("/").endswith("/me"):
            return FakeResponse(PATIENT_ID)

        patient_id = url.rstrip("/").split("/")[-1]
        return FakeResponse(patient_id)

    monkeypatch.setattr(
        "app.services.patient_client.httpx.get",
        fake_get,
    )
