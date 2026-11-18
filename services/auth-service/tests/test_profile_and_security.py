from tests.test_me import create_and_login


def test_forgot_password(client):
    res = client.post("/api/v1/auth/forgot-password", json={"email": "patient@example.com"})
    assert res.status_code == 200
    assert "message" in res.json()


def test_update_profile(client, test_email):
    token = create_and_login(client, test_email)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.patch(
        "/api/v1/auth/me",
        json={"full_name": "Updated Patient Name"},
        headers=headers,
    )
    assert res.status_code == 200
    assert res.json()["full_name"] == "Updated Patient Name"


def test_change_password(client, test_email):
    token = create_and_login(client, test_email)
    headers = {"Authorization": f"Bearer {token}"}

    # Mauvais mot de passe actuel
    res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "WrongPassword123!", "new_password": "NewSecretPassword123!"},
        headers=headers,
    )
    assert res.status_code == 400

    # Succès
    res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "TestPassword123!", "new_password": "NewSecretPassword123!"},
        headers=headers,
    )
    assert res.status_code == 200
    assert "message" in res.json()


def test_security_info(client, test_email):
    token = create_and_login(client, test_email)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/auth/security", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["session_validity_minutes"] == 30
    assert "jwt_algorithm" in data
