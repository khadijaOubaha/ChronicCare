
def test_create_patient_invalid_email(client):
    payload = {
        "first_name": "Test",
        "last_name": "Patient",
        "email": "email-invalide",
    }

    response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert response.status_code == 422


def test_create_patient_invalid_sex(client):
    payload = {
        "first_name": "Test",
        "last_name": "Patient",
        "sex": "UNKNOWN",
    }

    response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert response.status_code == 422


def test_create_patient_missing_first_name(client):
    payload = {
        "last_name": "Patient",
        "email": "test@example.com",
    }

    response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert response.status_code == 422


def test_create_patient_empty_first_name(client):
    payload = {
        "first_name": "",
        "last_name": "Patient",
    }

    response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert response.status_code == 422
