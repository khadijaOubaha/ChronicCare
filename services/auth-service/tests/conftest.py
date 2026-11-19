import os
from pathlib import Path
from urllib.parse import quote_plus

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

# Charger le fichier .env situé à la racine du projet
PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

# Configuration PostgreSQL
user = quote_plus(os.environ["POSTGRES_USER"])
password = quote_plus(os.environ["POSTGRES_PASSWORD"])
database = os.getenv("POSTGRES_DB") or "chroniccare"
port = os.getenv("POSTGRES_PORT") or "5433"

DATABASE_URL = (
    f"postgresql+psycopg://{user}:{password}"
    f"@127.0.0.1:{port}/{database}"
)

# Clé JWT réservée à l'environnement de test
os.environ["DATABASE_URL"] = DATABASE_URL
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-chroniccare-only")

# Importer l'application après la configuration des variables
from app.main import app

test_engine = create_engine(DATABASE_URL)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_email():
    import uuid

    email = f"pytest.auth.{uuid.uuid4().hex}@example.com"

    yield email

    # Nettoyer uniquement les données associées à cet e-mail de test
    with test_engine.begin() as connection:
        connection.execute(
            text("DELETE FROM patients WHERE email = :email"),
            {"email": email},
        )
        connection.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": email},
        )

@pytest.fixture
def db_engine():
    yield test_engine
