import os
import time
import uuid

# Doivent être définis avant l'import de l'application.
os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ["JWT_SECRET"] = "test-secret-teleconsultations-0123456789"
os.environ.pop("JWT_ALGORITHM", None)

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401  (enregistre les tables)
from app.database import Base, get_db
from app.main import app

TEST_SECRET = os.environ["JWT_SECRET"]


def make_token(sub=None, role="ADMIN", secret=TEST_SECRET, expires_in=3600, **extra):
    """Fabrique un jeton JWT de test (comme le ferait le service d'authentification)."""
    payload = {"sub": str(sub or uuid.uuid4()), "role": role, "exp": int(time.time()) + expires_in}
    payload.update(extra)
    return jwt.encode(payload, secret, algorithm="HS256")


def auth_headers(sub=None, role="ADMIN"):
    return {"Authorization": f"Bearer {make_token(sub, role)}"}


@pytest.fixture()
def _database():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
def client(_database):
    """Client authentifié en médecin (ADMIN). Pas de 'with' : le lifespan vise PostgreSQL."""
    return TestClient(app, headers=auth_headers(role="ADMIN"))


@pytest.fixture()
def anon_client(_database):
    """Client sans jeton."""
    return TestClient(app)


@pytest.fixture()
def patient_client_factory(_database):
    """Retourne une fonction qui crée un client authentifié en tant que PATIENT donné."""

    def factory(patient_id):
        return TestClient(app, headers=auth_headers(sub=patient_id, role="PATIENT"))

    return factory
