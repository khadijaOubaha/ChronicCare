import os
import uuid
from pathlib import Path
from urllib.parse import quote_plus

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

PROJECT_ROOT = Path(__file__).resolve().parents[3]
load_dotenv(PROJECT_ROOT / ".env")

user = quote_plus(os.environ["POSTGRES_USER"])
password = quote_plus(os.environ["POSTGRES_PASSWORD"])
database = os.getenv("POSTGRES_DB") or "chroniccare"
port = os.getenv("POSTGRES_PORT") or "5433"

DATABASE_URL = (
    f"postgresql+psycopg://{user}:{password}"
    f"@127.0.0.1:{port}/{database}"
)

os.environ["DATABASE_URL"] = DATABASE_URL
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-chroniccare-only")

from app.main import app
from app.models import User, UserRole
from app.security import hash_password

test_engine = create_engine(DATABASE_URL)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def db_engine():
    yield test_engine


@pytest.fixture
def test_email():
    email = f"pytest.auth.{uuid.uuid4().hex}@example.com"
    yield email

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
def admin_user():
    email = f"pytest.admin.{uuid.uuid4().hex}@example.com"
    password = "AdminTestPassword123!"

    with Session(test_engine) as db:
        admin = User(
            full_name="Test Administrator",
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()

    yield {"email": email, "password": password}

    with test_engine.begin() as connection:
        connection.execute(
            text("DELETE FROM users WHERE email = :email"),
            {"email": email},
        )


@pytest.fixture
def admin_token(client, admin_user):
    response = client.post(
        "/api/v1/auth/login",
        json=admin_user,
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def create_patient_account(client, admin_token):
    def _create(email, full_name="Test Patient", password="TestPassword123!"):
        return client.post(
            "/api/v1/auth/create-patient",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "full_name": full_name,
                "email": email,
                "password": password,
            },
        )

    return _create


@pytest.fixture
def create_and_login(client, create_patient_account):
    def _create_and_login(email, full_name="Test Patient"):
        response = create_patient_account(
            email,
            full_name=full_name,
        )
        assert response.status_code == 201, response.text

        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": email,
                "password": "TestPassword123!",
            },
        )
        assert login_response.status_code == 200, login_response.text

        return login_response.json()["access_token"]

    return _create_and_login
