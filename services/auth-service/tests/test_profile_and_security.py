def test_forgot_password(client):
    response = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "patient@example.com"},
    )

    assert response.status_code == 200
    assert "message" in response.json()


def test_update_profile(client, test_email, create_and_login):
    token = create_and_login(test_email)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.patch(
        "/api/v1/auth/me",
        json={"full_name": "Updated Patient Name"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "Updated Patient Name"


def test_change_password(client, test_email, create_and_login):
    token = create_and_login(test_email)
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "WrongPassword123!",
            "new_password": "NewSecretPassword123!",
        },
        headers=headers,
    )

    assert response.status_code == 400

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "TestPassword123!",
            "new_password": "NewSecretPassword123!",
        },
        headers=headers,
    )

    assert response.status_code == 200
    assert "message" in response.json()


def test_security_info(client, test_email, create_and_login):
    token = create_and_login(test_email)

    response = client.get(
        "/api/v1/auth/security",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["session_validity_minutes"] == 30
    assert data["jwt_algorithm"] == "HS256"
