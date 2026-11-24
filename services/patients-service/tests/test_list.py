def test_list_patients(client, patient_email, admin_headers):
    # CrÃ©er un patient de test
    create_response = client.post(
        "/api/v1/patients",
        json={"first_name": "List", "last_name": "Test", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION", "sex": "F"},
        headers=admin_headers,
    )
    assert create_response.status_code == 201

    # Lister les patients
    response = client.get("/api/v1/patients", headers=admin_headers)
    assert response.status_code == 200

    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "offset" in data
    assert "limit" in data
    assert isinstance(data["items"], list)
    assert any(p["email"] == patient_email for p in data["items"])


def test_list_patients_with_pagination(client, admin_headers):
    response = client.get("/api/v1/patients?offset=0&limit=5", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) <= 5


def test_list_patients_with_search(client, patient_email, admin_headers):
    client.post(
        "/api/v1/patients",
        json={"first_name": "SearchTest", "last_name": "User", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION"},
        headers=admin_headers,
    )
    response = client.get("/api/v1/patients?search=SearchTest", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert all("searchtest" in p["first_name"].lower() or patient_email == p["email"] for p in data["items"])


def test_list_patients_with_disease_filter(client, patient_email, admin_headers):
    client.post(
        "/api/v1/patients",
        json={"first_name": "Disease", "last_name": "Filter", "email": patient_email, "password": "TestPass123!", "disease": "HYPERTENSION", "disease": "HYPERTENSION"},
        headers=admin_headers,
    )
    response = client.get("/api/v1/patients?disease=HYPERTENSION", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    for p in data["items"]:
        assert p["disease"] == "HYPERTENSION"


def test_list_requires_auth(client):
    response = client.get("/api/v1/patients")
    assert response.status_code == 401
