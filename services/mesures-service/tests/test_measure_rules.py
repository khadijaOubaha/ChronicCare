import pytest
from app.services.measure_rules import normalize_name, get_rule, validate_values


def test_normalize_name_removes_accents_and_normalizes_spaces():
    assert normalize_name("  Tension   Artérielle ") == "tension arterielle"


def test_get_rule_for_glycemia():
    rule = get_rule("Glycémie")
    assert rule is not None
    assert rule.code == "glycemie"
    assert rule.deux_valeurs is False


def test_get_rule_for_blood_pressure():
    rule = get_rule("Tension artérielle")
    assert rule is not None
    assert rule.code == "tension_arterielle"
    assert rule.deux_valeurs is True


def test_get_rule_unknown_measurement_uses_generic_rule():
    rule = get_rule("Mesure inconnue")
    assert rule is not None
    assert rule.deux_valeurs is False


def test_valid_glycemia_values():
    rule = get_rule("Glycémie")
    errors = validate_values(rule, 120, None, "mg/dL")
    assert errors == []


def test_glycemia_below_minimum_is_rejected():
    rule = get_rule("Glycémie")
    errors = validate_values(rule, 10, None, "mg/dL")
    assert errors


def test_glycemia_above_maximum_is_rejected():
    rule = get_rule("Glycémie")
    errors = validate_values(rule, 700, None, "mg/dL")
    assert errors


def test_blood_pressure_accepts_two_valid_values():
    rule = get_rule("Tension artérielle")
    errors = validate_values(rule, 120, 80, "mmHg")
    assert errors == []


def test_blood_pressure_requires_secondary_value():
    rule = get_rule("Tension artérielle")
    errors = validate_values(rule, 120, None, "mmHg")
    assert errors


def test_blood_pressure_rejects_systolic_lower_than_diastolic():
    rule = get_rule("Tension artérielle")
    errors = validate_values(rule, 70, 90, "mmHg")
    assert errors


def test_single_value_measurement_rejects_secondary_value():
    rule = get_rule("Glycémie")
    errors = validate_values(rule, 120, 80, "mg/dL")
    assert errors
from app.services.measure_rules import get_rule, validate_values


def test_single_value_measurement_rejects_secondary_value():
    rule = get_rule("Glycémie")
    errors = validate_values(rule, 120, 80, "mg/dL")
    assert errors
