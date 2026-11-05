import uuid

PATIENT_ID = str(uuid.uuid4())
URL = "/api/v1/notifications"


def make_payload(**overrides):
    payload = {
        "patient_id": PATIENT_ID,
        "type": "info",
        "title": "Rappel de test",
        "message": "Message fictif",
    }
    payload.update(overrides)
    return payload


def test_create_notification_returns_201(client):
    response = client.post(URL, json=make_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["is_read"] is False
    assert body["read_at"] is None


def test_create_notification_invalid_returns_422(client):
    response = client.post(URL, json={"patient_id": "pas-un-uuid"})
    assert response.status_code == 422


def test_get_unknown_notification_returns_404(client):
    response = client.get(f"{URL}/{uuid.uuid4()}")
    assert response.status_code == 404


def test_list_is_filtered_by_patient_and_paginated(client):
    for i in range(3):
        client.post(URL, json=make_payload(title=f"Notif {i}"))
    client.post(URL, json=make_payload(patient_id=str(uuid.uuid4())))

    response = client.get(URL, params={"patient_id": PATIENT_ID, "limit": 2})
    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 3
    assert len(body["items"]) == 2


def test_mark_as_read(client):
    created = client.post(URL, json=make_payload()).json()
    response = client.patch(f"{URL}/{created['id']}/read")
    assert response.status_code == 200
    assert response.json()["is_read"] is True
    assert response.json()["read_at"] is not None


def test_unread_only_filter(client):
    created = client.post(URL, json=make_payload()).json()
    client.post(URL, json=make_payload())
    client.patch(f"{URL}/{created['id']}/read")

    response = client.get(URL, params={"patient_id": PATIENT_ID, "unread_only": True})
    assert response.json()["total"] == 1