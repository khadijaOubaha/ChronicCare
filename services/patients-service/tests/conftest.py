import uuid
import os
from pathlib import Path
from urllib.parse import quote_plus

import jwt
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

# Charger le fichier .env à la racine de ChronicCare
PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

# Construire l'URL PostgreSQL
user = quote_plus(os.environ["POSTGRES_USER"])
password = quote_plus(os.environ["POSTGRES_PASSWORD"])
database = os.getenv("POSTGRES_DB") or "chroniccare"
port = os.getenv("POSTGRES_PORT") or "5433"

DATABASE_URL = (
    f"postgresql+psycopg://{user}:{password}"
    f"@127.0.0.1:{port}/{database}"
)

# Clé JWT de test – on force l'override pour que les tokens de test
# soient toujours signés et vérifiés avec la même clé, indépendamment
# de ce que contient le fichier .env.
JWT_SECRET_KEY = "test-secret-key-chroniccare-only"
os.environ["DATABASE_URL"] = DATABASE_URL
os.environ["JWT_SECRET_KEY"] = JWT_SECRET_KEY  # force override (setdefault ne suffit pas)

from app.main import app  # noqa: E402

test_engine = create_engine(DATABASE_URL)


def make_token(role: str = "ADMIN") -> str:
    """Génère un JWT de test pour simuler l'authentification."""
    import time
    payload = {
        "sub": str(uuid.uuid4()),
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 3600,
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


@pytest.fixture
def admin_token():
    return make_token("ADMIN")


@pytest.fixture
def patient_token():
    return make_token("PATIENT")


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def patient_headers(patient_token):
    return {"Authorization": f"Bearer {patient_token}"}


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def patient_email():
    email = f"pytest.patient.{uuid.uuid4().hex}@example.com"

    yield email

    # Supprimer uniquement le patient créé par ce test
    with test_engine.begin() as connection:
        connection.execute(
            text("DELETE FROM patients WHERE email = :email"),
            {"email": email},
        )
