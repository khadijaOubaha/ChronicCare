
import time
import uuid

import jwt

PATIENT_ID = str(uuid.uuid4())
JWT_SECRET = "chroniccare-test-secret-key-32-bytes-minimum"


def make_event(**overrides):
    event = {
        "event_type": "measurement.abnormal",
        "patient_id": PATIENT_ID,
        "data": {},
    }
    event.update(overrides)
    return event


def make_token():
    now = int(time.time())
    payload = {
        "sub": PATIENT_ID,
        "role": "ADMIN",
        "iat": now,
        "exp": now + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def auth_headers():
    return {"Authorization": f"Bearer {make_token()}"}



def test_event_generates_notification(client, mock_patients_service):
    headers = auth_headers()

    response = client.post(
        "/api/v1/events",
        json=make_event(),
        headers=headers,
    )
    assert response.status_code == 201

    body = response.json()
    assert body["status"] == "processed"

    listing_response = client.get(
        "/api/v1/notifications",
        params={"patient_id": PATIENT_ID},
        headers=headers,
    )

    assert listing_response.status_code == 200

    listing = listing_response.json()
    assert listing["total"] == 1
    assert listing["items"][0]["source_event_id"] == body["event_id"]
    assert listing["items"][0]["id"] == body["notification_id"]



def test_unknown_event_type_returns_422(client):
    response = client.post(
        "/api/v1/events",
        json=make_event(event_type="inconnu.type"),
        headers=auth_headers(),
    )
    assert response.status_code == 422


def test_invalid_event_returns_422(client):
    response = client.post(
        "/api/v1/events",
        json={"event_type": "measurement.abnormal"},
        headers=auth_headers(),
    )
    assert response.status_code == 422


def test_event_without_token_returns_401(client):
    response = client.post(
        "/api/v1/events",
        json=make_event(),
    )
    assert response.status_code == 401


def test_event_with_invalid_token_returns_401(client):
    response = client.post(
        "/api/v1/events",
        json=make_event(),
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert response.status_code == 401
