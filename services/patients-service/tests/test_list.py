
def test_list_patients(client, patient_email):
    # 1. Créer un patient de test
    payload = {
        "first_name": "List",
        "last_name": "Test",
        "email": patient_email,
        "sex": "F"
    }

    create_response = client.post(
        "/api/v1/patients",
        json=payload
    )

    assert create_response.status_code == 201

    # 2. Récupérer la liste des patients
    response = client.get("/api/v1/patients")

    assert response.status_code == 200

    patients = response.json()

    # 3. Vérifier que la réponse est une liste
    assert isinstance(patients, list)

    # 4. Vérifier que notre patient figure dans la liste
    patient_found = any(
        patient["email"] == patient_email
        for patient in patients
    )

    assert patient_found


def test_list_patients_with_pagination(client):
    response = client.get(
        "/api/v1/patients?offset=0&limit=5"
    )

    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) <= 5
