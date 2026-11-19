def test_delete_patient(client, patient_email, admin_headers):
    create_response = client.post(
        "/api/v1/patients",
        json={"first_name": "Delete", "last_name": "Test", "email": patient_email, "sex": "F"},
        headers=admin_headers,
    )
    assert create_response.status_code == 201
    patient_id = create_response.json()["id"]

    delete_response = client.delete(f"/api/v1/patients/{patient_id}", headers=admin_headers)
    assert delete_response.status_code == 204

    get_response = client.get(f"/api/v1/patients/{patient_id}", headers=admin_headers)
    assert get_response.status_code == 404


def test_delete_patient_not_found(client, admin_headers):
    response = client.delete(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001",
        headers=admin_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Patient introuvable"


def test_delete_requires_admin(client, patient_email, patient_headers, admin_headers):
    create_response = client.post(
        "/api/v1/patients",
        json={"first_name": "Delete", "last_name": "Test", "email": patient_email},
        headers=admin_headers,
    )
    patient_id = create_response.json()["id"]
    response = client.delete(f"/api/v1/patients/{patient_id}", headers=patient_headers)
    assert response.status_code == 403
