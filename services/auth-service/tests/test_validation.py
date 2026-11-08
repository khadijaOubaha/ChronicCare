
def test_register_invalid_email(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": "invalid-email",
            "password": "TestPassword123!"
        }
    )

    assert response.status_code == 422


def test_register_short_password(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test User",
            "email": "short.password@example.com",
            "password": "123"
        }
    )

    assert response.status_code == 422


def test_register_short_full_name(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "A",
            "email": "short.name@example.com",
            "password": "TestPassword123!"
        }
    )

    assert response.status_code == 422


def test_register_missing_fields(client):
    response = client.post(
        "/api/v1/auth/register",
        json={}
    )

    assert response.status_code == 422
