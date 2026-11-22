from datetime import datetime, timezone
from uuid import uuid4


def build_measurement_abnormal_event(
    patient_id,
    doctor_id,
    patient_full_name: str,
    disease_type: str,
    measurement_id,
    measurement_type: str,
    value: float,
    unit: str,
    measured_at: datetime,
    anomalies: list[dict],
    secondary_value: float | None = None,
) -> dict:
    """
    Construit un événement measurement.abnormal
    conforme au contrat partagé avec Reminders.
    """

    return {
        "event_type": "measurement.abnormal",
        "event_version": "1.0",
        "event_id": str(uuid4()),
        "occurred_at": datetime.now(timezone.utc).isoformat(),
        "patient_id": str(patient_id),
        "doctor_id": str(doctor_id),
        "data": {
            "patient": {
                "full_name": patient_full_name,
                "disease_type": disease_type,
            },
            "measurement": {
                "measurement_id": str(measurement_id),
                "measurement_type": measurement_type,
                "value": value,
                "secondary_value": secondary_value,
                "unit": unit,
                "measured_at": measured_at.isoformat(),
            },
            "anomalies": anomalies,
        },
    }