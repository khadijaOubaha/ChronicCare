
def create_and_login(client, email):
    # Créer un utilisateur
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test JWT User",
            "email": email,
            "password": "TestPassword123!"
        }
    )
    assert register_response.status_code == 201

    # Se connecter pour obtenir un JWT
    login_response = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "TestPassword123!"
        }
    )
    assert login_response.status_code == 200

    return login_response.json()["access_token"]


def test_me_with_valid_token(client, test_email):
    token = create_and_login(client, test_email)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
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
        headers={"Authorization": "Bearer invalid-token"}
    )

    assert response.status_code == 401
