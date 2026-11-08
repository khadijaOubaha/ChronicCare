
def test_create_patient_success(client, patient_email):
    payload = {
        "first_name": "Test",
        "last_name": "Patient",
        "date_of_birth": "1998-05-15",
        "sex": "F",
        "phone": "0600000000",
        "email": patient_email,
        "address": "Agadir, Maroc"
    }

    response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert response.status_code == 201

    data = response.json()

    assert data["first_name"] == "Test"
    assert data["last_name"] == "Patient"
    assert data["email"] == patient_email
    assert data["sex"] == "F"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
