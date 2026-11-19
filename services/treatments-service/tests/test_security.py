def test_access_with_valid_admin_token(
    client,
    existing_treatment,
    admin_headers,
):
    response = client.get(
        f"/api/v1/treatments/{existing_treatment.id}",
        headers=admin_headers,
    )

    assert response.status_code == 200


def test_access_with_invalid_token(
    client,
    existing_treatment,
    invalid_token,
):
    response = client.get(
        f"/api/v1/treatments/{existing_treatment.id}",
        headers={
            "Authorization": f"Bearer {invalid_token}"
        },
    )

    assert response.status_code == 401


def test_access_without_token(
    client,
    existing_treatment,
):
    response = client.get(
        f"/api/v1/treatments/{existing_treatment.id}"
    )

    assert response.status_code == 401


def test_patient_role_forbidden_from_admin_endpoint(
    client,
    patient_headers,
    patient_id,
):
    response = client.get(
        f"/api/v1/patients/{patient_id}/treatments",
        headers=patient_headers,
    )

    assert response.status_code == 403