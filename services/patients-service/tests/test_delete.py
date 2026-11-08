
def test_delete_patient(client, patient_email):
    # 1. Créer un patient
    payload = {
        "first_name": "Delete",
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

    # 2. Supprimer le patient
    delete_response = client.delete(
        f"/api/v1/patients/{patient_id}"
    )

    assert delete_response.status_code == 204

    # 3. Vérifier que le patient n'existe plus
    get_response = client.get(
        f"/api/v1/patients/{patient_id}"
    )

    assert get_response.status_code == 404


def test_delete_patient_not_found(client):
    response = client.delete(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Patient introuvable"
