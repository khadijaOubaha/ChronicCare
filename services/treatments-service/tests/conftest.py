import os
import uuid
from pathlib import Path
from urllib.parse import quote_plus
from datetime import date, datetime, timedelta, timezone

import jwt
import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, delete
from sqlalchemy.orm import Session

# --------------------------------------------------
# 1. Charger le fichier .env à la racine du projet
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

# --------------------------------------------------
# 2. Configuration de la base PostgreSQL
# --------------------------------------------------

user = quote_plus(os.environ["POSTGRES_USER"])
password = quote_plus(os.environ["POSTGRES_PASSWORD"])
database = os.getenv("POSTGRES_DB") or "chroniccare"
port = os.getenv("POSTGRES_PORT") or "5433"

DATABASE_URL = (
    f"postgresql+psycopg://{user}:{password}"
    f"@127.0.0.1:{port}/{database}"
)

os.environ["DATABASE_URL"] = DATABASE_URL

# --------------------------------------------------
# 3. Configuration JWT de test
# --------------------------------------------------

os.environ.setdefault(
    "JWT_SECRET_KEY",
    "chroniccare-test-secret-key"
)

# --------------------------------------------------
# 4. Importer l'application et le modèle
# --------------------------------------------------

from app.main import app
from app.models.treatment import Treatment, Disease, TreatmentStatus

test_engine = create_engine(DATABASE_URL)

# --------------------------------------------------
# 5. Client de test
# --------------------------------------------------

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

# --------------------------------------------------
# 6. Identifiants de test
# --------------------------------------------------

@pytest.fixture
def patient_id():
    return uuid.uuid4()


@pytest.fixture
def admin_id():
    return uuid.uuid4()


@pytest.fixture
def patient_email():
    return f"pytest.treatment.{uuid.uuid4().hex}@example.com"

# --------------------------------------------------
# 7. Génération des tokens JWT
# --------------------------------------------------

@pytest.fixture
def admin_token(admin_id):
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(admin_id),
        "role": "ADMIN",
        "iat": now,
        "exp": now + timedelta(minutes=30),
    }

    return jwt.encode(
        payload,
        os.environ["JWT_SECRET_KEY"],
        algorithm="HS256",
    )


@pytest.fixture
def patient_token(patient_id):
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(patient_id),
        "role": "PATIENT",
        "iat": now,
        "exp": now + timedelta(minutes=30),
    }

    return jwt.encode(
        payload,
        os.environ["JWT_SECRET_KEY"],
        algorithm="HS256",
    )

# --------------------------------------------------
# 8. Headers HTTP
# --------------------------------------------------

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def patient_headers(patient_token):
    return {"Authorization": f"Bearer {patient_token}"}

# --------------------------------------------------
# 9. Nettoyage des traitements de test
# --------------------------------------------------

@pytest.fixture
def treatment_cleanup():
    treatment_ids = []

    def register(treatment_id):
        treatment_ids.append(treatment_id)

    yield register

    if treatment_ids:
        with Session(test_engine) as db:
            db.execute(
                delete(Treatment).where(
                    Treatment.id.in_(treatment_ids)
                )
            )
            db.commit()

# --------------------------------------------------
# 10. Création d'un traitement existant pour les tests
# --------------------------------------------------

@pytest.fixture
def existing_treatment(client, patient_id, admin_id, treatment_cleanup):

    treatment = Treatment(
        id=uuid.uuid4(),
        patient_id=patient_id,
        prescribed_by=admin_id,
        disease=Disease.TYPE_2_DIABETES,
        medication_name="Metformin",
        dosage="500 mg",
        frequency="2 fois par jour",
        start_date=date.today(),
        end_date=None,
        instructions="À prendre après les repas",
        status=TreatmentStatus.ACTIVE,
    )

    with Session(test_engine, expire_on_commit=False) as db:
        db.add(treatment)
        db.commit()
        db.refresh(treatment)

    treatment_cleanup(treatment.id)

    return treatment
@pytest.fixture
def invalid_token():
    return "this-is-an-invalid-jwt-token"