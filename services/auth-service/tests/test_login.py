def test_login_success(client, test_email, create_patient_account):
    response = create_patient_account(
        test_email,
        full_name="Test Login User",
    )
    assert response.status_code == 201, response.text

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"].lower() == "bearer"
    assert len(data["access_token"]) > 0


def test_login_wrong_password(client, test_email, create_patient_account):
    response = create_patient_account(test_email)
    assert response.status_code == 201, response.text

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401


def test_login_unknown_email(client):
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "unknown.user.123456@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401
