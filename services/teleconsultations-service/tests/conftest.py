import os
import time
import uuid

# Configuration avant import de l'application
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ["PATIENTS_SERVICE_URL"] = "http://patients-service.test"
TEST_SECRET = "test-secret-teleconsultations-0123456789"
os.environ["JWT_SECRET_KEY"] = TEST_SECRET
os.environ["JWT_SECRET"] = TEST_SECRET
os.environ.pop("JWT_ALGORITHM", None)

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.database import Base, get_db
from app.main import app

DOCTOR_ID = "11111111-1111-4111-8111-111111111111"


def make_token(sub=None, role="ADMIN", secret=TEST_SECRET, expires_in=3600, **extra):
    payload = {
        "sub": str(sub or uuid.uuid4()),
        "role": role,
        "exp": int(time.time()) + expires_in,
    }
    payload.update(extra)
    return jwt.encode(payload, secret, algorithm="HS256")


def auth_headers(sub=None, role="ADMIN"):
    return {"Authorization": f"Bearer {make_token(sub, role)}"}


def mock_external_services(monkeypatch):
    import app.routers.teleconsultations as router

    # Simule la validation du dossier patient sans appel réseau.
    monkeypatch.setattr(
        router,
        "verify_patient_in_patients_service",
        lambda patient_id, token: None,
    )

    # Le dossier patient correspond à l'identifiant du compte connecté.
    monkeypatch.setattr(
        router,
        "get_patient_id_from_patients_service",
        lambda user: uuid.UUID(str(user.id)),
    )

    # Simule la vérification du médecin actif dans Auth Service.
    # La table users appartient au service Auth et n'existe pas ici.
    monkeypatch.setattr(
        router,
        "verify_active_doctor",
        lambda db, doctor_id: None,
    )

    # Évite l'envoi réel d'événements vers Reminders Service.
    monkeypatch.setattr(
        router,
        "emit_teleconsultation_event",
        lambda **kwargs: None,
    )


@pytest.fixture()
def _database():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    def override_get_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(_database, monkeypatch):
    mock_external_services(monkeypatch)
    return TestClient(
        app,
        headers=auth_headers(sub=DOCTOR_ID, role="ADMIN"),
    )


@pytest.fixture()
def anon_client(_database):
    return TestClient(app)


@pytest.fixture()
def patient_client_factory(_database, monkeypatch):
    mock_external_services(monkeypatch)

    def factory(patient_id):
        return TestClient(
            app,
            headers=auth_headers(sub=patient_id, role="PATIENT"),
        )

    return factory
