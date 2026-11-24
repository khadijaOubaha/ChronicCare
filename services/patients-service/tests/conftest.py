import uuid
import os
from pathlib import Path
from urllib.parse import quote_plus

import jwt
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

# Charger le fichier .env Ã  la racine de ChronicCare
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

# ClÃ© JWT de test â€“ on force l'override pour que les tokens de test
# soient toujours signÃ©s et vÃ©rifiÃ©s avec la mÃªme clÃ©, indÃ©pendamment
# de ce que contient le fichier .env.
JWT_SECRET_KEY = "test-secret-key-chroniccare-only"
os.environ["DATABASE_URL"] = DATABASE_URL
os.environ["JWT_SECRET_KEY"] = JWT_SECRET_KEY  # force override (setdefault ne suffit pas)

from app.main import app  # noqa: E402

test_engine = create_engine(DATABASE_URL)


def make_token(role: str = "ADMIN") -> str:
    """GÃ©nÃ¨re un JWT de test pour simuler l'authentification."""
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

    # Supprimer uniquement le patient crÃ©Ã© par ce test
    with test_engine.begin() as connection:
        connection.execute(
            text("DELETE FROM patients WHERE email = :email"),
            {"email": email},
        )


from types import SimpleNamespace

@pytest.fixture(autouse=True)
def mock_auth_service(monkeypatch):
    def fake_auth_post(url, *args, **kwargs):
        if url.endswith("/api/v1/auth/create-patient"):
            account_data = kwargs["json"]
            user_id = uuid.uuid4()

            with test_engine.begin() as connection:
                connection.execute(
                    text("""
                        INSERT INTO users (
                            id, full_name, email, hashed_password,
                            role, is_active, created_at
                        )
                        VALUES (
                            :id, :full_name, :email, :hashed_password,
                            'PATIENT', TRUE, CURRENT_TIMESTAMP
                        )
                    """),
                    {
                        "id": user_id,
                        "full_name": account_data.get("full_name", "Test Patient"),
                        "email": account_data["email"],
                        "hashed_password": "test-hashed-password",
                    },
                )

            return SimpleNamespace(
                status_code=201,
                json=lambda: {"id": str(user_id)}
            )

        raise AssertionError(f"Unexpected HTTP request: {url}")

    monkeypatch.setattr(
        "app.routers.patients.httpx.post",
        fake_auth_post
    )
