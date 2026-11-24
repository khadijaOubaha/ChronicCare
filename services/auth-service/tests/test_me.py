def test_me_with_valid_token(client, test_email, create_and_login):
    token = create_and_login(
        test_email,
        full_name="Test JWT User",
    )

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert data["email"] == test_email
    assert data["full_name"] == "Test JWT User"
    assert data["role"] == "PATIENT"


def test_me_without_token(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token(client):
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"},
    )

    assert response.status_code == 401
