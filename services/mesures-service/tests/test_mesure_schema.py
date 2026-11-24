import math
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas.mesure import MesureCreate


def test_mesure_create_accepts_valid_data():
    payload = MesureCreate(
        type_mesure_id=uuid4(),
        valeur=120,
        valeur_secondaire=80,
        commentaire=" Mesure du matin "
    )
    assert payload.valeur == 120
    assert payload.commentaire == "Mesure du matin"


def test_mesure_create_accepts_optional_fields_as_empty():
    payload = MesureCreate(type_mesure_id=uuid4(), valeur=100)
    assert payload.valeur_secondaire is None
    assert payload.commentaire is None


def test_mesure_create_rejects_nan():
    with pytest.raises(ValidationError):
        MesureCreate(type_mesure_id=uuid4(), valeur=float("nan"))


def test_mesure_create_rejects_infinity():
    with pytest.raises(ValidationError):
        MesureCreate(type_mesure_id=uuid4(), valeur=math.inf)


def test_mesure_create_rejects_unknown_fields():
    with pytest.raises(ValidationError):
        MesureCreate(
            type_mesure_id=uuid4(),
            valeur=100,
            unexpected_field="not allowed"
        )


def test_mesure_create_rejects_long_comment():
    with pytest.raises(ValidationError):
        MesureCreate(
            type_mesure_id=uuid4(),
            valeur=100,
            commentaire="x" * 1001
        )


def test_mesure_create_converts_blank_comment_to_none():
    payload = MesureCreate(
        type_mesure_id=uuid4(),
        valeur=100,
        commentaire="   "
    )
    assert payload.commentaire is None
