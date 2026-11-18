def test_create_patient_invalid_email(client, admin_headers):
    payload = {"first_name": "Test", "last_name": "Patient", "email": "email-invalide"}
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 422


def test_create_patient_invalid_sex(client, admin_headers):
    payload = {"first_name": "Test", "last_name": "Patient", "sex": "UNKNOWN"}
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 422


def test_create_patient_missing_first_name(client, admin_headers):
    payload = {"last_name": "Patient", "email": "test@example.com"}
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 422


def test_create_patient_empty_first_name(client, admin_headers):
    payload = {"first_name": "", "last_name": "Patient"}
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 422


def test_create_patient_invalid_disease(client, admin_headers):
    payload = {"first_name": "Test", "last_name": "Patient", "disease": "UNKNOWN_DISEASE"}
    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)
    assert response.status_code == 422
