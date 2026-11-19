def test_get_treatment_success(
    client,
    existing_treatment,
    admin_headers,
):
    response = client.get(
        f"/api/v1/treatments/{existing_treatment.id}",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == str(existing_treatment.id)
    assert data["medication_name"] == "Metformin"
    assert data["dosage"] == "500 mg"
    assert data["status"] == "ACTIVE"


def test_get_treatment_not_found(client, admin_headers):
    import uuid

    treatment_id = uuid.uuid4()

    response = client.get(
        f"/api/v1/treatments/{treatment_id}",
        headers=admin_headers,
    )

    assert response.status_code == 404


def test_get_treatment_without_token(client, existing_treatment):
    response = client.get(
        f"/api/v1/treatments/{existing_treatment.id}"
    )

    assert response.status_code == 401


def test_patient_cannot_read_another_patient_treatment(
    client,
    existing_treatment,
    patient_headers,
):
    response = client.get(
        f"/api/v1/treatments/{existing_treatment.id}",
        headers=patient_headers,
    )

    assert response.status_code == 403