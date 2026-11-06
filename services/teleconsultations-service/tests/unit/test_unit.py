"""Tests unitaires purs : aucune base de données, aucun client HTTP."""
import uuid
from datetime import datetime, timedelta, timezone
 
import pytest
from pydantic import ValidationError
 
from app.models import Teleconsultation, utcnow
from app.routers.teleconsultations import (
    ALLOWED_TRANSITIONS,
    TERMINAL_STATUSES,
    to_naive_utc,
)
from app.schemas import (
    TeleconsultationCreate,
    TeleconsultationStatus,
    TeleconsultationStatusUpdate,
    TeleconsultationUpdate,
)
 
PATIENT = uuid.uuid4()
DOCTOR = uuid.uuid4()
WHEN = datetime(2030, 1, 1, 10, 0, tzinfo=timezone.utc)
 
 
# --- Conversion des dates -------------------------------------------------
 
def test_to_naive_utc_converts_offset_to_utc():
    value = datetime(2030, 1, 1, 12, 0, tzinfo=timezone(timedelta(hours=2)))
    assert to_naive_utc(value) == datetime(2030, 1, 1, 10, 0)
    assert to_naive_utc(value).tzinfo is None
 
 
def test_to_naive_utc_keeps_naive_date_unchanged():
    value = datetime(2030, 1, 1, 10, 0)
    assert to_naive_utc(value) == value
 
 
def test_utcnow_is_naive_and_recent():
    now = utcnow()
    assert now.tzinfo is None
    assert abs((datetime.now(timezone.utc).replace(tzinfo=None) - now).total_seconds()) < 5
 
 
# --- Machine à états ------------------------------------------------------
 
def test_every_status_has_transition_rules():
    assert set(ALLOWED_TRANSITIONS) == {s.value for s in TeleconsultationStatus}
 
 
def test_scheduled_can_become_completed_or_cancelled():
    assert ALLOWED_TRANSITIONS["SCHEDULED"] == {"COMPLETED", "CANCELLED"}
 
 
@pytest.mark.parametrize("final", ["COMPLETED", "CANCELLED"])
def test_final_statuses_have_no_transition(final):
    assert final in TERMINAL_STATUSES
    assert ALLOWED_TRANSITIONS[final] == set()
 
 
def test_scheduled_is_not_terminal():
    assert "SCHEDULED" not in TERMINAL_STATUSES
 
 
# --- Schémas Pydantic -----------------------------------------------------
 
def test_create_schema_accepts_minimal_payload():
    obj = TeleconsultationCreate(patient_id=PATIENT, doctor_id=DOCTOR, scheduled_at=WHEN)
    assert obj.meeting_link is None
    assert obj.notes is None
 
 
def test_create_schema_parses_uuid_strings():
    obj = TeleconsultationCreate(
        patient_id=str(PATIENT), doctor_id=str(DOCTOR), scheduled_at=WHEN.isoformat()
    )
    assert obj.patient_id == PATIENT
    assert obj.scheduled_at == WHEN
 
 
@pytest.mark.parametrize("field", ["patient_id", "doctor_id", "scheduled_at"])
def test_create_schema_requires_main_fields(field):
    data = {"patient_id": PATIENT, "doctor_id": DOCTOR, "scheduled_at": WHEN}
    del data[field]
    with pytest.raises(ValidationError):
        TeleconsultationCreate(**data)
 
 
def test_create_schema_rejects_invalid_uuid():
    with pytest.raises(ValidationError):
        TeleconsultationCreate(patient_id="123", doctor_id=DOCTOR, scheduled_at=WHEN)
 
 
def test_create_schema_rejects_too_long_meeting_link():
    with pytest.raises(ValidationError):
        TeleconsultationCreate(
            patient_id=PATIENT,
            doctor_id=DOCTOR,
            scheduled_at=WHEN,
            meeting_link="x" * 501,
        )
 
 
def test_create_schema_rejects_too_long_notes():
    with pytest.raises(ValidationError):
        TeleconsultationCreate(
            patient_id=PATIENT, doctor_id=DOCTOR, scheduled_at=WHEN, notes="x" * 2001
        )
 
 
def test_update_schema_all_fields_optional():
    assert TeleconsultationUpdate().model_dump(exclude_unset=True) == {}
 
 
def test_update_schema_only_sets_given_fields():
    data = TeleconsultationUpdate(notes="RAS").model_dump(exclude_unset=True)
    assert data == {"notes": "RAS"}
 
 
def test_status_schema_accepts_known_values():
    for value in ("SCHEDULED", "COMPLETED", "CANCELLED"):
        assert TeleconsultationStatusUpdate(status=value).status.value == value
 
 
@pytest.mark.parametrize("bad", ["planned", "scheduled", "DONE", ""])
def test_status_schema_rejects_unknown_values(bad):
    with pytest.raises(ValidationError):
        TeleconsultationStatusUpdate(status=bad)
 
 
# --- Modèle SQLAlchemy ----------------------------------------------------
 
def test_model_table_and_columns_match_class_diagram():
    columns = set(Teleconsultation.__table__.columns.keys())
    assert Teleconsultation.__tablename__ == "teleconsultations"
    assert columns == {
        "id",
        "patient_id",
        "doctor_id",
        "scheduled_at",
        "meeting_link",
        "status",
        "notes",
        "created_at",
    }
 
 
def test_model_has_no_foreign_keys_to_other_services():
    assert not Teleconsultation.__table__.foreign_keys
 
 
def test_model_required_columns():
    table = Teleconsultation.__table__
    for name in ("patient_id", "doctor_id", "scheduled_at", "status"):
        assert table.c[name].nullable is False
    for name in ("meeting_link", "notes"):
        assert table.c[name].nullable is True
 
 
# --- Contrainte CHECK sur status (appliquée par la base) -------------------
 
def test_check_constraint_rejects_invalid_status_in_database():
    from sqlalchemy import create_engine
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy.orm import sessionmaker
 
    from app.database import Base
 
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    session.add(
        Teleconsultation(
            patient_id=PATIENT,
            doctor_id=DOCTOR,
            scheduled_at=datetime(2030, 1, 1, 10, 0),
            status="INVALID",
        )
    )
    with pytest.raises(IntegrityError):
        session.commit()
    session.rollback()
    session.close()
 
 
@pytest.mark.parametrize("valid", ["SCHEDULED", "COMPLETED", "CANCELLED"])
def test_check_constraint_accepts_valid_statuses_in_database(valid):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
 
    from app.database import Base
 
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    session.add(
        Teleconsultation(
            patient_id=PATIENT,
            doctor_id=DOCTOR,
            scheduled_at=datetime(2030, 1, 1, 10, 0),
            status=valid,
        )
    )
    session.commit()
    session.close()
 