import uuid

from sqlalchemy import create_engine, text
import os
from pathlib import Path
from urllib.parse import quote_plus

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient

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

# Configurer les variables avant l'import de l'application
os.environ["DATABASE_URL"] = DATABASE_URL

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client
test_engine = create_engine(DATABASE_URL)


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