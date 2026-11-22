

import time
import uuid

import jwt

PATIENT_ID = str(uuid.uuid4())
URL = "/api/v1/notifications"
JWT_SECRET = "chroniccare-test-secret-key-32-bytes-minimum"


def make_token(role="ADMIN"):
    now = int(time.time())
    payload = {
        "sub": str(uuid.uuid4()),
        "role": role,
        "iat": now,
        "exp": now + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def auth_headers(role="ADMIN"):
    return {"Authorization": f"Bearer {make_token(role)}"}


def make_payload(**overrides):
    payload = {
        "patient_id": PATIENT_ID,
        "type": "info",
        "title": "Rappel de test",
        "message": "Message fictif",
    }
    payload.update(overrides)
    return payload


def test_create_notification_returns_201(client, mock_patients_service):
    response = client.post(
        URL,
        json=make_payload(),
        headers=auth_headers(),
    )
    assert response.status_code == 201
    body = response.json()
    assert body["is_read"] is False
    assert body["read_at"] is None


def test_create_notification_invalid_returns_422(client):
    response = client.post(
        URL,
        json={"patient_id": "pas-un-uuid"},
        headers=auth_headers(),
    )
    assert response.status_code == 422


def test_get_unknown_notification_returns_404(client):
    response = client.get(
        f"{URL}/{uuid.uuid4()}",
        headers=auth_headers(),
    )
    assert response.status_code == 404


def test_list_is_filtered_by_patient_and_paginated(
    client,
    mock_patients_service,
):
    for i in range(3):
        client.post(
            URL,
            json=make_payload(title=f"Notif {i}"),
            headers=auth_headers(),
        )

    client.post(
        URL,
        json=make_payload(patient_id=str(uuid.uuid4())),
        headers=auth_headers(),
    )

    response = client.get(
        URL,
        params={"patient_id": PATIENT_ID, "limit": 2},
        headers=auth_headers(),
    )

    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 3
    assert len(body["items"]) == 2


def test_mark_as_read(client, mock_patients_service):
    created = client.post(
        URL,
        json=make_payload(),
        headers=auth_headers(),
    ).json()

    response = client.patch(
        f"{URL}/{created['id']}/read",
        headers=auth_headers(),
    )

    assert response.status_code == 200
    assert response.json()["is_read"] is True
    assert response.json()["read_at"] is not None


def test_unread_only_filter(client, mock_patients_service):
    created = client.post(
        URL,
        json=make_payload(),
        headers=auth_headers(),
    ).json()

    client.post(
        URL,
        json=make_payload(),
        headers=auth_headers(),
    )

    client.patch(
        f"{URL}/{created['id']}/read",
        headers=auth_headers(),
    )

    response = client.get(
        URL,
        params={"patient_id": PATIENT_ID, "unread_only": True},
        headers=auth_headers(),
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1
