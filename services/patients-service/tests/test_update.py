def test_update_patient(client, patient_email, admin_headers):
    create_response = client.post(
        "/api/v1/patients",
        json={"first_name": "Before", "last_name": "Update", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION", "sex": "F"},
        headers=admin_headers,
    )
    assert create_response.status_code == 201
    patient_id = create_response.json()["id"]

    update_payload = {"first_name": "After", "phone": "0612345678", "disease": "TYPE_2_DIABETES"}
    response = client.patch(f"/api/v1/patients/{patient_id}", json=update_payload, headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert data["first_name"] == "After"
    assert data["last_name"] == "Update"
    assert data["phone"] == "0612345678"
    assert data["disease"] == "TYPE_2_DIABETES"


def test_update_patient_not_found(client, admin_headers):
    response = client.patch(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001",
        json={"first_name": "NewName"},
        headers=admin_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Patient introuvable."


def test_update_requires_admin(client, patient_email, patient_headers, admin_headers):
    create_response = client.post(
        "/api/v1/patients",
        json={"first_name": "Before", "last_name": "Update", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION"},
        headers=admin_headers,
    )
    patient_id = create_response.json()["id"]
    response = client.patch(
        f"/api/v1/patients/{patient_id}",
        json={"first_name": "After"},
        headers=patient_headers,
    )
    assert response.status_code == 403
