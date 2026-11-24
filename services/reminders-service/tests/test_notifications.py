
import time
import uuid

import jwt

PATIENT_ID = "11111111-1111-1111-1111-111111111111"
PATIENT_USER_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
DOCTOR_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
URL = "/api/v1/notifications"
EVENT_URL = "/api/v1/events"

JWT_SECRET = "chroniccare-test-secret-key-32-bytes-minimum"


def make_token(user_id, role):
    user_id = str(user_id)
    now = int(time.time())

    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + 3600,
    }

    token = jwt.encode(
        payload,
        JWT_SECRET,
        algorithm="HS256"
    )

    return {"Authorization": f"Bearer {token}"}


def create_event(client, mock_patients_service, title="Mesure anormale"):
    return client.post(
        EVENT_URL,
        json={
            "event_type": "measurement.abnormal",
            "patient_id": PATIENT_ID,
            "doctor_id": DOCTOR_ID,
            "data": {"title": title},
        },
        headers=make_token(DOCTOR_ID, "ADMIN"),
    )


def test_event_creates_notification_for_patient_and_doctor(
    client,
    mock_patients_service,
):
    response = create_event(client, mock_patients_service)

    assert response.status_code == 201

    # Le médecin doit recevoir sa propre notification.
    doctor_response = client.get(
        URL,
        headers=make_token(DOCTOR_ID, "ADMIN"),
    )

    assert doctor_response.status_code == 200
    assert doctor_response.json()["total"] == 1

    # Le patient doit également recevoir la notification.
    patient_response = client.get(
        URL,
        headers=make_token(PATIENT_USER_ID, "PATIENT"),
    )

    assert patient_response.status_code == 200
    assert patient_response.json()["total"] == 1


def test_patient_and_doctor_have_independent_read_states(
    client,
    mock_patients_service,
):
    created = create_event(client, mock_patients_service)
    assert created.status_code == 201

    notification_id = created.json()["notification_id"]

    # Le médecin marque sa notification comme lue.
    doctor_read = client.patch(
        f"{URL}/{notification_id}/read",
        headers=make_token(DOCTOR_ID, "ADMIN"),
    )

    assert doctor_read.status_code == 200
    assert doctor_read.json()["is_read"] is True

    # Le patient conserve son état non lu.
    patient_notification = client.get(
        f"{URL}/{notification_id}",
        headers=make_token(PATIENT_USER_ID, "PATIENT"),
    )

    assert patient_notification.status_code == 200
    assert patient_notification.json()["is_read"] is False


def test_get_unknown_notification_returns_404(client):
    response = client.get(
        f"{URL}/{uuid.uuid4()}",
        headers=make_token(DOCTOR_ID, "ADMIN"),
    )

    assert response.status_code == 404


def test_unread_only_filter(
    client,
    mock_patients_service,
):
    first = create_event(client, mock_patients_service)
    second = create_event(client, mock_patients_service)

    assert first.status_code == 201
    assert second.status_code == 201

    client.patch(
        f"{URL}/{first.json()['notification_id']}/read",
        headers=make_token(DOCTOR_ID, "ADMIN"),
    )

    response = client.get(
        URL,
        params={"unread_only": True},
        headers=make_token(DOCTOR_ID, "ADMIN"),
    )

    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_notification_is_not_accessible_to_another_user(
    client,
    mock_patients_service,
):
    created = create_event(client, mock_patients_service)
    assert created.status_code == 201

    another_user = uuid.uuid4()

    response = client.get(
        f"{URL}/{created.json()['notification_id']}",
        headers=make_token(another_user, "ADMIN"),
    )

    assert response.status_code == 403