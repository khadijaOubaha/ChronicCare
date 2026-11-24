from app.services.anomaly_service import detect_anomalies


def test_normal_glycemia_has_no_anomaly():
    assert detect_anomalies("glycemie", 100) == []


def test_low_glycemia_detects_anomaly():
    anomalies = detect_anomalies("glycemie", 50)
    assert len(anomalies) >= 1
    assert any(a["direction"] == "low" for a in anomalies)


def test_high_glycemia_detects_anomaly():
    anomalies = detect_anomalies("glycemie", 220)
    assert len(anomalies) >= 1
    assert any(a["direction"] == "high" for a in anomalies)


def test_normal_blood_pressure_has_no_anomaly():
    assert detect_anomalies("tension_arterielle", 120, 80) == []


def test_high_systolic_pressure_detects_anomaly():
    anomalies = detect_anomalies("tension_arterielle", 160, 80)
    assert anomalies


def test_low_diastolic_pressure_detects_anomaly():
    anomalies = detect_anomalies("tension_arterielle", 120, 50)
    assert anomalies


def test_unknown_measurement_type_has_no_anomaly():
    assert detect_anomalies("type_inconnu", 100) == []
