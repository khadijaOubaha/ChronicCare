import uuid

PATIENT_ID = str(uuid.uuid4())


def make_event(**overrides):
    event = {
        "event_type": "measurement.abnormal",
        "patient_id": PATIENT_ID,
        "data": {},
    }
    event.update(overrides)
    return event


def test_event_generates_notification(client):
    response = client.post("/api/v1/events", json=make_event())
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "processed"

    listing = client.get("/api/v1/notifications", params={"patient_id": PATIENT_ID}).json()
    assert listing["total"] == 1
    assert listing["items"][0]["source_event_id"] == body["event_id"]
    assert listing["items"][0]["id"] == body["notification_id"]


def test_unknown_event_type_returns_422(client):
    response = client.post("/api/v1/events", json=make_event(event_type="inconnu.type"))
    assert response.status_code == 422


def test_invalid_event_returns_422(client):
    response = client.post("/api/v1/events", json={"event_type": "measurement.abnormal"})
    assert response.status_code == 422