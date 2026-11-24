def test_create_patient_invalid_email(client, admin_token):
    response = client.post(
        "/api/v1/auth/create-patient",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "full_name": "Test User",
            "email": "invalid-email",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 422


def test_create_patient_short_password(client, admin_token):
    response = client.post(
        "/api/v1/auth/create-patient",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "full_name": "Test User",
            "email": "short.password@example.com",
            "password": "123",
        },
    )

    assert response.status_code == 422


def test_create_patient_short_full_name(client, admin_token):
    response = client.post(
        "/api/v1/auth/create-patient",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "full_name": "A",
            "email": "short.name@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 422


def test_create_patient_missing_fields(client, admin_token):
    response = client.post(
        "/api/v1/auth/create-patient",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={},
    )

    assert response.status_code == 422
