def test_create_patient_success(client, patient_email, admin_headers):
    payload = {
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1998-05-15",
        "sex": "F",
        "phone": "0600000000",
        "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION",
        "address": "Agadir, Maroc",
        "disease": "HYPERTENSION",
    }

    response = client.post("/api/v1/patients", json=payload, headers=admin_headers)

    assert response.status_code == 201, response.text

    data = response.json()
    assert data["first_name"] == "Test"
    assert data["last_name"] == "Patient"
    assert data["email"] == patient_email
    assert data["sex"] == "F"
    assert data["disease"] == "HYPERTENSION"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data


def test_create_patient_requires_auth(client, patient_email):
    payload = {"first_name": "Test", "last_name": "Patient", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION"}
    response = client.post("/api/v1/patients", json=payload)
    assert response.status_code == 401


def test_create_patient_requires_admin(client, patient_email, patient_headers):
    payload = {"first_name": "Test", "last_name": "Patient", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION"}
    response = client.post("/api/v1/patients", json=payload, headers=patient_headers)
    assert response.status_code == 403
