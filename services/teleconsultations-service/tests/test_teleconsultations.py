import uuid
from datetime import datetime, timedelta, timezone

BASE = "/api/v1/teleconsultations"

PATIENT_1 = str(uuid.uuid4())
PATIENT_2 = str(uuid.uuid4())
DOCTOR_1 = str(uuid.uuid4())
DOCTOR_2 = str(uuid.uuid4())


def future(hours=24, minutes=0):
    dt = datetime.now(timezone.utc) + timedelta(hours=hours, minutes=minutes)
    return dt.isoformat()


def payload(**overrides):
    data = {
        "patient_id": PATIENT_1,
        "doctor_id": DOCTOR_1,
        "scheduled_at": future(),
        "meeting_link": "https://meet.example.com/room-1",
        "notes": "Suivi mensuel",
    }
    data.update(overrides)
    return data


def create(client, **overrides):
    return client.post(BASE, json=payload(**overrides))


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_create_returns_201_and_scheduled_status(client):
    response = create(client)
    assert response.status_code == 201
    body = response.json()
    uuid.UUID(body["id"])
    assert body["status"] == "SCHEDULED"
    assert body["patient_id"] == PATIENT_1
    assert body["doctor_id"] == DOCTOR_1
    assert body["meeting_link"] == "https://meet.example.com/room-1"
    assert "created_at" in body


def test_create_without_optional_fields(client):
    response = client.post(
        BASE,
        json={
            "patient_id": PATIENT_1,
            "doctor_id": DOCTOR_1,
            "scheduled_at": future(),
        },
    )
    assert response.status_code == 201
    assert response.json()["meeting_link"] is None


def test_create_in_the_past_returns_400(client):
    assert create(client, scheduled_at=future(hours=-2)).status_code == 400


def test_create_invalid_uuid_returns_422(client):
    assert create(client, patient_id="123").status_code == 422
    assert create(client, doctor_id="abc").status_code == 422


def test_create_missing_field_returns_422(client):
    response = client.post(BASE, json={"patient_id": PATIENT_1})
    assert response.status_code == 422


def test_same_doctor_same_time_returns_409(client):
    when = future(24)
    assert create(client, scheduled_at=when).status_code == 201
    response = create(client, patient_id=PATIENT_2, scheduled_at=when)
    assert response.status_code == 409


def test_same_patient_same_time_returns_409(client):
    when = future(24)
    assert create(client, scheduled_at=when).status_code == 201
    response = create(client, doctor_id=DOCTOR_2, scheduled_at=when)
    assert response.status_code == 409


def test_same_time_different_people_is_allowed(client):
    when = future(24)
    assert create(client, scheduled_at=when).status_code == 201
    response = create(client, patient_id=PATIENT_2, doctor_id=DOCTOR_2, scheduled_at=when)
    assert response.status_code == 201


def test_cancelled_slot_can_be_reused(client):
    when = future(24)
    first = create(client, scheduled_at=when).json()
    client.patch(f"{BASE}/{first['id']}/status", json={"status": "CANCELLED"})
    assert create(client, scheduled_at=when).status_code == 201


def test_get_and_404(client):
    created = create(client).json()
    assert client.get(f"{BASE}/{created['id']}").status_code == 200
    assert client.get(f"{BASE}/{uuid.uuid4()}").status_code == 404


def test_get_invalid_uuid_returns_422(client):
    assert client.get(f"{BASE}/999").status_code == 422


def test_list_pagination(client):
    for i in range(5):
        assert create(client, scheduled_at=future(24 + i)).status_code == 201
    response = client.get(BASE, params={"skip": 2, "limit": 2})
    body = response.json()
    assert response.status_code == 200
    assert body["total"] == 5
    assert len(body["items"]) == 2
    assert body["skip"] == 2 and body["limit"] == 2


def test_list_filters(client):
    create(client, patient_id=PATIENT_1, doctor_id=DOCTOR_1, scheduled_at=future(24))
    create(client, patient_id=PATIENT_2, doctor_id=DOCTOR_1, scheduled_at=future(26))
    create(client, patient_id=PATIENT_2, doctor_id=DOCTOR_2, scheduled_at=future(28))

    assert client.get(BASE, params={"patient_id": PATIENT_2}).json()["total"] == 2
    assert client.get(BASE, params={"doctor_id": DOCTOR_2}).json()["total"] == 1
    assert client.get(BASE, params={"status": "SCHEDULED"}).json()["total"] == 3
    assert client.get(BASE, params={"status": "CANCELLED"}).json()["total"] == 0
    window = {"date_from": future(25), "date_to": future(27)}
    assert client.get(BASE, params=window).json()["total"] == 1


def test_list_limit_too_high_returns_422(client):
    assert client.get(BASE, params={"limit": 1000}).status_code == 422


def test_update_changes_fields(client):
    created = create(client).json()
    response = client.put(
        f"{BASE}/{created['id']}",
        json={"meeting_link": "https://meet.example.com/room-2", "notes": "Contrôle"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["meeting_link"] == "https://meet.example.com/room-2"
    assert body["notes"] == "Contrôle"


def test_update_does_not_conflict_with_itself(client):
    created = create(client).json()
    response = client.put(f"{BASE}/{created['id']}", json={"notes": "RAS"})
    assert response.status_code == 200


def test_update_into_conflict_returns_409(client):
    when = future(24)
    create(client, scheduled_at=when)
    second = create(client, patient_id=PATIENT_2, scheduled_at=future(30)).json()
    response = client.put(f"{BASE}/{second['id']}", json={"scheduled_at": when})
    assert response.status_code == 409


def test_update_to_past_returns_400(client):
    created = create(client).json()
    response = client.put(f"{BASE}/{created['id']}", json={"scheduled_at": future(-5)})
    assert response.status_code == 400


def test_update_unknown_returns_404(client):
    response = client.put(f"{BASE}/{uuid.uuid4()}", json={"notes": "x"})
    assert response.status_code == 404


def test_status_valid_transitions(client):
    done = create(client, scheduled_at=future(24)).json()
    response = client.patch(f"{BASE}/{done['id']}/status", json={"status": "COMPLETED"})
    assert response.status_code == 200
    assert response.json()["status"] == "COMPLETED"

    cancelled = create(client, scheduled_at=future(26)).json()
    response = client.patch(f"{BASE}/{cancelled['id']}/status", json={"status": "CANCELLED"})
    assert response.status_code == 200
    assert response.json()["status"] == "CANCELLED"


def test_status_terminal_cannot_change(client):
    created = create(client).json()
    url = f"{BASE}/{created['id']}/status"
    client.patch(url, json={"status": "CANCELLED"})
    assert client.patch(url, json={"status": "COMPLETED"}).status_code == 409
    assert client.patch(url, json={"status": "SCHEDULED"}).status_code == 409


def test_status_unknown_value_returns_422(client):
    created = create(client).json()
    response = client.patch(f"{BASE}/{created['id']}/status", json={"status": "foo"})
    assert response.status_code == 422


def test_cancelled_cannot_be_updated(client):
    created = create(client).json()
    client.patch(f"{BASE}/{created['id']}/status", json={"status": "CANCELLED"})
    response = client.put(f"{BASE}/{created['id']}", json={"notes": "x"})
    assert response.status_code == 409


def test_delete(client):
    created = create(client).json()
    assert client.delete(f"{BASE}/{created['id']}").status_code == 204
    assert client.get(f"{BASE}/{created['id']}").status_code == 404
    assert client.delete(f"{BASE}/{created['id']}").status_code == 404
