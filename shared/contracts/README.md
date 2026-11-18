# 📦 Contrats Partagés Inter-services (JSON Schemas) — ChronicCare

Ce dossier centralise les **contrats d'événements officiels** échangés entre les microservices via l'endpoint :
`POST http://reminders-service:8004/api/v1/events`

---

## 🎯 Architecture

```
Microservice Émetteur                  Microservice Récepteur
(Traitements / Mesures)                   (Rappels & Alertes)
       │                                           ▲
       │  1. Construit le JSON selon le schéma    │
       │  2. Envoie en HTTPX + BackgroundTasks    │
       └────────────────── HTTP POST ──────────────┘
                         (JSON REST)
```

---

## 📂 Liste des Contrats Disponibles

| Fichier Schéma | Émetteur | Type d'événement | Description |
|---|---|---|---|
| [`treatment_updated.schema.json`](./treatment_updated.schema.json) | **Treatments Service** | `treatment.updated` | Notification de création (`created`), mise à jour (`updated`) ou arrêt (`stopped`) d'un traitement. |
| [`measurement_abnormal.schema.json`](./measurement_abnormal.schema.json) | **Measurements Service** | `measurement.abnormal` | Déclenchement d'une alerte en cas de mesure critique (hyperglycémie, pic de tension). |

---

## 🛠️ Comment utiliser ces schémas dans FastAPI ?

### Côté Émetteur (ex: Treatments Service) :
Le service émetteur utilise `HTTPX` et `BackgroundTasks` de FastAPI pour envoyer la requête de manière asynchrone non-bloquante :

```python
from fastapi import BackgroundTasks
import httpx

REMINDERS_URL = "http://reminders-service:8004/api/v1/events"

def notify_reminders(event_payload: dict, token: str = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        with httpx.Client(timeout=3.0) as client:
            client.post(REMINDERS_URL, json=event_payload, headers=headers)
    except Exception as exc:
        print(f"Warning: Reminders service indisponible: {exc}")

@router.patch("/treatments/{id}/stop")
def stop_treatment(id: UUID, background_tasks: BackgroundTasks):
    # ... mise à jour en base ...
    payload = {
        "event_type": "treatment.updated",
        "patient_id": str(treatment.patient_id),
        "doctor_id": str(treatment.prescribed_by),
        "data": {
            "treatment_id": str(treatment.id),
            "action": "stopped",
            "medication_name": treatment.medication_name,
            "dosage": treatment.dosage
        }
    }
    background_tasks.add_task(notify_reminders, payload)
    return treatment
```

### Côté Récepteur (Reminders Service) :
Le service Rappels valide l'événement entrant et renvoie un statut `201 Created` :
```json
{
  "event_id": "c1a9f022-7f2e-4b77-8f5b-11c9bb763001",
  "status": "processed"
}
```
Si le `event_type` est inconnu, il renvoie une erreur `422 Unprocessable Entity`.
