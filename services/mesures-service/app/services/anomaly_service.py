from app.rules.anomaly_rules import ANOMALY_THRESHOLDS


def detect_anomalies(
    measurement_type: str,
    value: float,
    secondary_value: float | None = None,
) -> list[dict]:
    """
    Détecte les valeurs nécessitant une notification de surveillance.
    Retourne une liste vide si aucune anomalie n'est détectée.
    """

    anomalies = []

    if measurement_type not in ANOMALY_THRESHOLDS:
        return anomalies

    rules = ANOMALY_THRESHOLDS[measurement_type]

    if measurement_type == "tension_arterielle":
        if value < rules["systolic"]["low"]:
            anomalies.append({
                "rule_code": "systolic_low",
                "direction": "low",
                "message": "La pression systolique est inférieure au seuil de surveillance."
            })

        elif value >= rules["systolic"]["high"]:
            anomalies.append({
                "rule_code": "systolic_high",
                "direction": "high",
                "message": "La pression systolique atteint ou dépasse le seuil de surveillance."
            })

        if secondary_value is not None:
            if secondary_value < rules["diastolic"]["low"]:
                anomalies.append({
                    "rule_code": "diastolic_low",
                    "direction": "low",
                    "message": "La pression diastolique est inférieure au seuil de surveillance."
                })

            elif secondary_value >= rules["diastolic"]["high"]:
                anomalies.append({
                    "rule_code": "diastolic_high",
                    "direction": "high",
                    "message": "La pression diastolique atteint ou dépasse le seuil de surveillance."
                })

        return anomalies

    if value < rules["low"]:
        anomalies.append({
            "rule_code": f"{measurement_type}_low",
            "direction": "low",
            "message": f"La valeur de {measurement_type} est inférieure au seuil de surveillance."
        })

    elif value > rules["high"]:
        anomalies.append({
            "rule_code": f"{measurement_type}_high",
            "direction": "high",
            "message": f"La valeur de {measurement_type} dépasse le seuil de surveillance."
        })

    return anomalies