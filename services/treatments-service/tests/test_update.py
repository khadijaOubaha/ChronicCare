
def test_update_treatment_success(
    client,
    existing_treatment,
    admin_headers,
):
    payload = {
        "medication_name": "Metformine 850",
        "dosage": "850 mg",
    }

    response = client.patch(
        f"/api/v1/treatments/{existing_treatment.id}",
        json=payload,
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["medication_name"] == "Metformine 850"
    assert data["dosage"] == "850 mg"

    # Les autres champs ne doivent pas changer
    assert data["frequency"] == "2 fois par jour"


def test_update_treatment_not_found(client, admin_headers):
    response = client.patch(
        "/api/v1/treatments/00000000-0000-0000-0000-000000000001",
        json={"medication_name": "Nouveau médicament"},
        headers=admin_headers,
    )

    assert response.status_code == 404


def test_update_treatment_invalid_dates(
    client,
    existing_treatment,
    admin_headers,
):
    response = client.patch(
        f"/api/v1/treatments/{existing_treatment.id}",
        json={"end_date": "2025-12-01"},
        headers=admin_headers,
    )

    assert response.status_code == 422


def test_update_stopped_treatment(
    client,
    existing_treatment,
    admin_headers,
):
    from app.models.treatment import TreatmentStatus
    from app.database import SessionLocal

    with SessionLocal() as db:
        treatment = db.get(
            type(existing_treatment),
            existing_treatment.id,
        )
        treatment.status = TreatmentStatus.STOPPED
        db.commit()

    response = client.patch(
        f"/api/v1/treatments/{existing_treatment.id}",
        json={"dosage": "1000 mg"},
        headers=admin_headers,
    )

    assert response.status_code == 409
