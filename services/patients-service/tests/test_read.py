
def test_get_patient_by_id(client, patient_email):
    # 1. Créer un patient
    payload = {
        "first_name": "Read",
        "last_name": "Test",
        "email": patient_email,
        "sex": "F"
    }

    create_response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert create_response.status_code == 201

    patient_id = create_response.json()["id"]

    # 2. Récupérer le patient par son ID
    response = client.get(
        f"/api/v1/patients/{patient_id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == patient_id
    assert data["first_name"] == "Read"
    assert data["last_name"] == "Test"
    assert data["email"] == patient_email


def test_get_patient_not_found(client):
    response = client.get(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient introuvable"
