
def test_create_treatment_success(
    client,
    admin_headers,
    patient_id,
    treatment_cleanup,
    monkeypatch,
):
    from app.routers import treatments as treatment_router

    monkeypatch.setattr(
        treatment_router,
        "verify_patient",
        lambda patient_id: None,
    )

    payload = {
        "patient_id": str(patient_id),
        "disease": "TYPE_2_DIABETES",
        "medication_name": "Metformine",
        "dosage": "500 mg",
        "frequency": "2 fois par jour",
        "start_date": "2026-01-01",
        "end_date": "2026-03-01",
        "instructions": "Après les repas",
    }

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["medication_name"] == "Metformine"
    assert data["dosage"] == "500 mg"
    assert data["disease"] == "TYPE_2_DIABETES"
    assert data["status"] == "ACTIVE"

    treatment_cleanup(data["id"])


def test_patient_cannot_create_treatment(
    client,
    patient_headers,
    patient_id,
):
    payload = {
        "patient_id": str(patient_id),
        "disease": "TYPE_2_DIABETES",
        "medication_name": "Metformine",
        "dosage": "500 mg",
        "frequency": "2 fois par jour",
        "start_date": "2026-01-01",
    }

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=patient_headers,
    )

    assert response.status_code == 403


def test_create_treatment_without_token(
    client,
    patient_id,
):
    payload = {
        "patient_id": str(patient_id),
        "disease": "TYPE_2_DIABETES",
        "medication_name": "Metformine",
        "dosage": "500 mg",
        "frequency": "2 fois par jour",
        "start_date": "2026-01-01",
    }

    response = client.post(
        "/api/v1/treatments",
        json=payload,
    )

    assert response.status_code == 401
