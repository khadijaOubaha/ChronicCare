
def test_stop_treatment_success(
    client,
    existing_treatment,
    admin_headers,
):
    response = client.patch(
        f"/api/v1/treatments/{existing_treatment.id}/stop",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "STOPPED"


def test_stop_treatment_not_found(client, admin_headers):
    response = client.patch(
        "/api/v1/treatments/00000000-0000-0000-0000-000000000001/stop",
        headers=admin_headers,
    )

    assert response.status_code == 404


def test_stop_already_stopped_treatment(
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
        f"/api/v1/treatments/{existing_treatment.id}/stop",
        headers=admin_headers,
    )

    assert response.status_code == 409


def test_patient_cannot_stop_treatment(
    client,
    existing_treatment,
    patient_headers,
):
    response = client.patch(
        f"/api/v1/treatments/{existing_treatment.id}/stop",
        headers=patient_headers,
    )

    assert response.status_code == 403
