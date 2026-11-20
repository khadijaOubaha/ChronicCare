def test_get_patient_by_id(client, patient_email, admin_headers):
    create_response = client.post(
        "/api/v1/patients",
        json={"first_name": "Read", "last_name": "Test", "email": patient_email, "sex": "F"},
        headers=admin_headers,
    )
    assert create_response.status_code == 201
    patient_id = create_response.json()["id"]

    response = client.get(f"/api/v1/patients/{patient_id}", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == patient_id
    assert data["first_name"] == "Read"
    assert data["email"] == patient_email


def test_get_patient_not_found(client, admin_headers):
    response = client.get(
        "/api/v1/patients/00000000-0000-0000-0000-000000000001",
        headers=admin_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Patient introuvable"


def test_get_patient_requires_auth(client):
    response = client.get("/api/v1/patients/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 401
