from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.errors import DomainError
from app.services.mesure_service import (
    pick_primary_type,
    resolve_period,
    to_type_read,
)


def make_type(name):
    return SimpleNamespace(
        id=uuid4(),
        nom=name,
        unite="mg/dL",
        description="Test"
    )


def test_resolve_period_with_days():
    today = date(2026, 11, 24)

    start, end = resolve_period(7, None, None, today)

    assert start == date(2026, 11, 18)
    assert end == today


def test_resolve_period_with_explicit_dates():
    start_date = date(2026, 11, 1)
    end_date = date(2026, 11, 20)

    start, end = resolve_period(None, start_date, end_date, date.today())

    assert start == start_date
    assert end == end_date


def test_resolve_period_without_filters():
    start, end = resolve_period(None, None, None, date.today())

    assert start is None
    assert end is None


def test_resolve_period_rejects_days_and_dates_together():
    with pytest.raises(DomainError) as exc:
        resolve_period(
            7,
            date(2026, 11, 1),
            date(2026, 11, 20),
            date(2026, 11, 24)
        )

    assert exc.value.code == "periode_invalide"


def test_resolve_period_rejects_start_after_end():
    with pytest.raises(DomainError) as exc:
        resolve_period(
            None,
            date(2026, 11, 20),
            date(2026, 11, 1),
            date(2026, 11, 24)
        )

    assert exc.value.code == "periode_invalide"


def test_pick_primary_type_for_diabetes():
    glucose = make_type("Glycémie")
    weight = make_type("Poids")

    result = pick_primary_type(
        [weight, glucose],
        "diabetes_type_2"
    )

    assert result is glucose


def test_pick_primary_type_for_hypertension():
    pressure = make_type("Tension artérielle")
    weight = make_type("Poids")

    result = pick_primary_type(
        [weight, pressure],
        "hypertension"
    )

    assert result is pressure


def test_pick_primary_type_falls_back_to_first_type():
    first = make_type("Poids")
    second = make_type("Température corporelle")

    result = pick_primary_type(
        [first, second],
        "unknown_disease"
    )

    assert result is first


def test_pick_primary_type_returns_none_for_empty_list():
    assert pick_primary_type([], "diabetes_type_2") is None


def test_to_type_read_converts_measurement_type():
    glucose = make_type("Glycémie")

    result = to_type_read(glucose)

    assert result.nom == "Glycémie"
    assert result.code == "glycemie"
    assert result.deux_valeurs is False
    assert result.valeur_min == 20
