
def test_update_patient(client, patient_email):
    # 1. Créer un patient
    payload = {
        "first_name": "Before",
        "last_name": "Update",
        "email": patient_email,
        "sex": "F"
    }

    create_response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert create_response.status_code == 201

    patient_id = create_response.json()["id"]

    # 2. Modifier le prénom et le téléphone
    update_payload = {
        "first_name": "After",
        "phone": "0612345678"
    }

    response = client.patch(
        f"/api/v1/patients/{patient_id}",
        json=update_payload
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == patient_id
    assert data["first_name"] == "After"
    assert data["last_name"] == "Update"
    assert data["phone"] == "0612345678"
    assert data["email"] == patient_email


def test_update_patient_not_found(client):
    response = client.patch(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001",
        json={"first_name": "NewName"}
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient introuvable"
