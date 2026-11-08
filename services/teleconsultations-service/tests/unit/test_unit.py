import uuid
from datetime import datetime

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import create_engine
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import Teleconsultation
from app.routers.teleconsultations import ALLOWED_TRANSITIONS, TERMINAL_STATUSES
from app.security import CurrentUser, get_current_user, require_admin
from tests.conftest import make_token


def creds(token):
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_status_transitions_rules():
    """Seul SCHEDULED évolue ; COMPLETED et CANCELLED sont finaux."""
    assert ALLOWED_TRANSITIONS["SCHEDULED"] == {"COMPLETED", "CANCELLED"}
    for final in ("COMPLETED", "CANCELLED"):
        assert ALLOWED_TRANSITIONS[final] == set()
        assert final in TERMINAL_STATUSES


def test_table_matches_diagram_and_check_constraint():
    """La table correspond au diagramme ; la contrainte CHECK refuse un statut inconnu."""
    table = Teleconsultation.__table__
    assert set(table.columns.keys()) == {
        "id", "patient_id", "doctor_id", "scheduled_at",
        "meeting_link", "status", "notes", "created_at",
    }
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    session.add(Teleconsultation(
        patient_id=uuid.uuid4(), doctor_id=uuid.uuid4(),
        scheduled_at=datetime(2030, 1, 1, 10, 0), status="INVALID",
    ))
    with pytest.raises(IntegrityError):
        session.commit()


def test_jwt_accepts_valid_token_and_rejects_others():
    """Jeton valide -> utilisateur ; absent, falsifié, expiré ou rôle inconnu -> 401."""
    user_id = uuid.uuid4()
    assert get_current_user(creds(make_token(sub=user_id, role="PATIENT"))) == CurrentUser(user_id, "PATIENT")
    for bad in (None, creds("pas-un-jeton"), creds(make_token(expires_in=-10)), creds(make_token(role="ROOT"))):
        with pytest.raises(HTTPException) as exc:
            get_current_user(bad)
        assert exc.value.status_code == 401


def test_require_admin_refuses_patient():
    with pytest.raises(HTTPException) as exc:
        require_admin(CurrentUser(id=uuid.uuid4(), role="PATIENT"))
    assert exc.value.status_code == 403
