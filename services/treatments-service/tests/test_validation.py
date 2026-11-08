
def valid_payload(patient_id):
    return {
        "patient_id": str(patient_id),
        "disease": "TYPE_2_DIABETES",
        "medication_name": "Metformine",
        "dosage": "500 mg",
        "frequency": "2 fois par jour",
        "start_date": "2026-01-01",
        "end_date": "2026-03-01",
    }


def test_create_treatment_invalid_disease(
    client,
    admin_headers,
    patient_id,
):
    payload = valid_payload(patient_id)
    payload["disease"] = "INVALID_DISEASE"

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_treatment_missing_medication(
    client,
    admin_headers,
    patient_id,
):
    payload = valid_payload(patient_id)
    del payload["medication_name"]

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_treatment_empty_dosage(
    client,
    admin_headers,
    patient_id,
):
    payload = valid_payload(patient_id)
    payload["dosage"] = ""

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_treatment_end_date_before_start_date(
    client,
    admin_headers,
    patient_id,
):
    payload = valid_payload(patient_id)
    payload["start_date"] = "2026-03-01"
    payload["end_date"] = "2026-01-01"

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_create_treatment_invalid_patient_id(
    client,
    admin_headers,
):
    payload = {
        "patient_id": "not-a-uuid",
        "disease": "TYPE_2_DIABETES",
        "medication_name": "Metformine",
        "dosage": "500 mg",
        "frequency": "2 fois par jour",
        "start_date": "2026-01-01",
    }

    response = client.post(
        "/api/v1/treatments",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 422
