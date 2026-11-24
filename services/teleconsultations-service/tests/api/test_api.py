import uuid
from datetime import datetime, timedelta, timezone

BASE = "/api/v1/teleconsultations"

PATIENT_1 = str(uuid.uuid4())
PATIENT_2 = str(uuid.uuid4())
DOCTOR_1 = "11111111-1111-4111-8111-111111111111"
DOCTOR_2 = str(uuid.uuid4())


def future(hours=24):
    return (datetime.now(timezone.utc) + timedelta(hours=hours)).isoformat()


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


def set_status(client, teleconsultation_id, status):
    return client.patch(f"{BASE}/{teleconsultation_id}/status", json={"status": status})


# --- CrÃ©neaux ----------------------------------------------------------------

def test_create_scheduled_and_refuse_past_date(client):
    response = create(client)
    assert response.status_code == 201
    assert response.json()["status"] == "SCHEDULED"
    assert create(client, scheduled_at=future(-1)).status_code == 400


def test_slot_conflicts_and_cancelled_slot_reuse(client):
    when = future(24)
    first = create(client, scheduled_at=when).json()
    # mÃªme mÃ©decin, ou mÃªme patient, au mÃªme instant
    assert create(client, patient_id=PATIENT_2, scheduled_at=when).status_code == 409
    assert create(client, doctor_id=DOCTOR_2, scheduled_at=when).status_code == 403
    assert client.get(BASE).json()["total"] == 1
    # un crÃ©neau annulÃ© est de nouveau libre
    assert set_status(client, first["id"], "CANCELLED").status_code == 200
    assert create(client, scheduled_at=when).status_code == 201


# --- Statuts -----------------------------------------------------------------

def test_status_transitions(client):
    done = create(client).json()
    assert set_status(client, done["id"], "COMPLETED").json()["status"] == "COMPLETED"
    # un statut final est verrouillÃ©
    assert set_status(client, done["id"], "CANCELLED").status_code == 409
    assert set_status(client, done["id"], "SCHEDULED").status_code == 409


# --- Modification ------------------------------------------------------------

def test_update_rules_by_status(client):
    # SCHEDULED : modifiable
    scheduled = create(client).json()
    url = f"{BASE}/{scheduled['id']}"
    assert client.put(url, json={"notes": "v2"}).status_code == 200

    # COMPLETED : seules les notes restent modifiables
    set_status(client, scheduled["id"], "COMPLETED")
    response = client.put(url, json={"notes": "Compte rendu"})
    assert response.status_code == 200 and response.json()["notes"] == "Compte rendu"
    assert client.put(url, json={"meeting_link": "https://meet.example.com/x"}).status_code == 409

    # CANCELLED : tout est verrouillÃ©
    cancelled = create(client, scheduled_at=future(48)).json()
    set_status(client, cancelled["id"], "CANCELLED")
    assert client.put(f"{BASE}/{cancelled['id']}", json={"notes": "x"}).status_code == 409


# --- Droits (JWT) ------------------------------------------------------------

def test_missing_or_invalid_token_returns_401(anon_client):
    some_id = uuid.uuid4()
    for method, url in (("get", BASE), ("post", BASE), ("delete", f"{BASE}/{some_id}")):
        assert getattr(anon_client, method)(url).status_code == 401
    forged = {"Authorization": "Bearer pas-un-jeton"}
    assert anon_client.get(BASE, headers=forged).status_code == 401


def test_patient_cannot_write(client, patient_client_factory):
    created = create(client).json()
    url = f"{BASE}/{created['id']}"
    patient = patient_client_factory(PATIENT_1)
    assert patient.post(BASE, json={}).status_code == 403
    assert patient.put(url, json={"notes": "x"}).status_code == 403
    assert patient.patch(f"{url}/status", json={"status": "COMPLETED"}).status_code == 403
    assert patient.delete(url).status_code == 403
    assert client.get(url).json()["status"] == "SCHEDULED"


def test_patient_only_sees_own_teleconsultations(client, patient_client_factory):
    own = create(client, scheduled_at=future(24)).json()
    other = create(client, patient_id=PATIENT_2, scheduled_at=future(25)).json()
    patient = patient_client_factory(PATIENT_1)
    assert patient.get(f"{BASE}/{own['id']}").status_code == 200
    assert patient.get(f"{BASE}/{other['id']}").status_code == 404
    listing = patient.get(BASE, params={"patient_id": PATIENT_2}).json()
    assert listing["total"] == 1 and listing["items"][0]["patient_id"] == PATIENT_1


# --- Demande du patient (REQUESTED) ------------------------------------------

def request_as(patient, **overrides):
    data = {"doctor_id": DOCTOR_1, "notes": "ContrÃ´le de la glycÃ©mie"}
    data.update(overrides)
    return patient.post(f"{BASE}/requests", json=data)


def test_patient_request_forces_identity_and_status(patient_client_factory):
    patient = patient_client_factory(PATIENT_1)
    # patient_id / status envoyÃ©s par le client sont ignorÃ©s
    response = request_as(patient, patient_id=PATIENT_2, status="SCHEDULED")
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "REQUESTED"
    assert body["patient_id"] == PATIENT_1
    assert body["scheduled_at"] is None and body["meeting_link"] is None
    # date souhaitÃ©e passÃ©e refusÃ©e
    assert request_as(patient, scheduled_at=future(-1)).status_code == 400


def test_doctor_cannot_use_patient_request_route(client):
    assert request_as(client).status_code == 403


def test_request_does_not_block_slot(client, patient_client_factory):
    when = future(24)
    patient = patient_client_factory(PATIENT_1)
    assert request_as(patient, scheduled_at=when).status_code == 201
    assert create(client, scheduled_at=when).status_code == 201


def test_doctor_confirms_request(client, patient_client_factory):
    patient = patient_client_factory(PATIENT_1)
    req = request_as(patient).json()
    url = f"{BASE}/{req['id']}"
    # confirmation : date obligatoire et dans le futur
    assert client.patch(f"{url}/confirm", json={"scheduled_at": future(-1)}).status_code == 400
    confirmed = client.patch(
        f"{url}/confirm",
        json={"scheduled_at": future(48), "meeting_link": "https://meet.example.com/r"},
    )
    assert confirmed.status_code == 200
    assert confirmed.json()["status"] == "SCHEDULED"
    assert confirmed.json()["meeting_link"] == "https://meet.example.com/r"
    # une fois confirmÃ©e, on ne peut plus la confirmer
    assert client.patch(f"{url}/confirm", json={"scheduled_at": future(72)}).status_code == 409
    # le patient voit sa consultation confirmÃ©e
    assert patient.get(url).json()["status"] == "SCHEDULED"


def test_confirm_refuses_taken_slot(client, patient_client_factory):
    when = future(24)
    create(client, patient_id=PATIENT_2, scheduled_at=when)
    req = request_as(patient_client_factory(PATIENT_1)).json()
    response = client.patch(f"{BASE}/{req['id']}/confirm", json={"scheduled_at": when})
    assert response.status_code == 409


def test_doctor_refuses_request(client, patient_client_factory):
    req = request_as(patient_client_factory(PATIENT_1)).json()
    url = f"{BASE}/{req['id']}"
    # SCHEDULED par /status interdit : il faut /confirm
    assert set_status(client, req["id"], "SCHEDULED").status_code == 409
    assert set_status(client, req["id"], "COMPLETED").status_code == 409
    assert set_status(client, req["id"], "CANCELLED").json()["status"] == "CANCELLED"
    assert client.put(url, json={"notes": "x"}).status_code == 409


def test_patient_cannot_confirm_or_see_others_requests(client, patient_client_factory):
    req = request_as(patient_client_factory(PATIENT_1)).json()
    other = patient_client_factory(PATIENT_2)
    assert other.patch(f"{BASE}/{req['id']}/confirm", json={"scheduled_at": future()}).status_code == 403
    assert other.get(f"{BASE}/{req['id']}").status_code == 404
    assert other.get(BASE).json()["total"] == 0


def test_request_update_limited_to_notes_and_link(client, patient_client_factory):
    req = request_as(patient_client_factory(PATIENT_1)).json()
    url = f"{BASE}/{req['id']}"
    assert client.put(url, json={"notes": "prÃ©cisions"}).status_code == 200
    assert client.put(url, json={"scheduled_at": future()}).status_code == 409
