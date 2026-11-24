from sqlalchemy import text


def test_admin_create_patient_success(
    test_email,
    create_patient_account,
    db_engine,
):
    response = create_patient_account(
        test_email.upper(),
        full_name="Test Auth User",
    )

    assert response.status_code == 201, response.text

    data = response.json()
    assert data["email"] == test_email.lower()
    assert data["full_name"] == "Test Auth User"
    assert data["role"] == "PATIENT"
    assert data["is_active"] is True

    with db_engine.connect() as connection:
        user = connection.execute(
            text("SELECT id, email FROM users WHERE email = :email"),
            {"email": test_email.lower()},
        ).fetchone()

    assert user is not None


def test_admin_create_patient_duplicate_email(
    test_email,
    create_patient_account,
):
    first = create_patient_account(test_email)
    assert first.status_code == 201, first.text

    second = create_patient_account(test_email)

    assert second.status_code == 409


def test_create_patient_without_token(client, test_email):
    response = client.post(
        "/api/v1/auth/create-patient",
        json={
            "full_name": "Unauthorized Patient",
            "email": test_email,
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401


def test_patient_cannot_create_another_patient(
    client,
    test_email,
    create_patient_account,
):
    created = create_patient_account(test_email)
    assert created.status_code == 201, created.text

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "TestPassword123!",
        },
    )
    assert login.status_code == 200

    patient_token = login.json()["access_token"]

    response = client.post(
        "/api/v1/auth/create-patient",
        headers={"Authorization": f"Bearer {patient_token}"},
        json={
            "full_name": "Another Patient",
            "email": f"another.{test_email}",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 403
