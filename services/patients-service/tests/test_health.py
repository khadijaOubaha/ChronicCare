
def test_root(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "service": "patients-service",
        "message": "Bienvenue dans ChronicCare",
        "status": "running",
    }


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
