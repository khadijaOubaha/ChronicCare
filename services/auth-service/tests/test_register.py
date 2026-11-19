from sqlalchemy import text


def test_register_success(client, test_email, db_engine):
    payload = {
        "full_name": "Test Auth User",
        "email": test_email.upper(),
        "password": "TestPassword123!"
    }

    response = client.post("/api/v1/auth/register", json=payload)

    # Vérifier la réponse HTTP
    assert response.status_code == 201

    data = response.json()
    assert data["email"] == test_email.lower()
    assert data["full_name"] == "Test Auth User"
    assert data["role"] == "PATIENT"
    assert data["is_active"] is True

    # Vérifier la création de l'utilisateur dans PostgreSQL
    with db_engine.connect() as connection:
        user = connection.execute(
            text("SELECT id, email FROM users WHERE email = :email"),
            {"email": test_email.lower()}
        ).fetchone()

        assert user is not None

        # Vérifier la création du profil patient associé
        patient = connection.execute(
            text("""
                SELECT first_name, last_name, user_id
                FROM patients
                WHERE email = :email
            """),
            {"email": test_email.lower()}
        ).fetchone()

        assert patient is not None
        assert patient.user_id == user.id
        assert patient.first_name == "Test"
        assert patient.last_name == "Auth User"


def test_register_duplicate_email(client, test_email):
    payload = {
        "full_name": "Test Duplicate",
        "email": test_email,
        "password": "TestPassword123!"
    }

    first_response = client.post(
        "/api/v1/auth/register",
        json=payload
    )
    assert first_response.status_code == 201

    second_response = client.post(
        "/api/v1/auth/register",
        json=payload
    )
    assert second_response.status_code == 409
