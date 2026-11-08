
def test_admin_get_my_treatments(
    client,
    existing_treatment,
    admin_headers,
):
    response = client.get(
        "/api/v1/treatments/me",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert any(
        item["id"] == str(existing_treatment.id)
        for item in data
    )


def test_patient_without_patient_profile(
    client,
    patient_headers,
):
    response = client.get(
        "/api/v1/treatments/me",
        headers=patient_headers,
    )

    assert response.status_code == 404

    assert response.json()["detail"] == (
        "Aucune fiche patient associee a ce compte."
    )


def test_admin_get_patient_treatments(
    client,
    existing_treatment,
    admin_headers,
    monkeypatch,
):
    from app.routers import treatments as treatment_router

    monkeypatch.setattr(
        treatment_router,
        "verify_patient",
        lambda patient_id: None,
    )

    response = client.get(
        f"/api/v1/patients/{existing_treatment.patient_id}/treatments",
        headers=admin_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert any(
        item["id"] == str(existing_treatment.id)
        for item in data
    )


def test_patient_cannot_get_patient_treatments(
    client,
    existing_treatment,
    patient_headers,
):
    response = client.get(
        f"/api/v1/patients/{existing_treatment.patient_id}/treatments",
        headers=patient_headers,
    )

    assert response.status_code == 403
