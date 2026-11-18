# Reminders Service — Contrat API

## 1. Présentation

Le service Reminders gère les rappels et notifications destinés aux patients.

Les rappels peuvent être déclenchés par des événements provenant d'autres services, notamment lorsqu'un traitement est arrêté ou modifié.

**Port :** à confirmer.

**Préfixe API :** à confirmer.

**Responsable :** membre de l'équipe Reminders.

## 2. Relation avec Treatments

Lorsqu'un traitement est arrêté, Treatments peut produire un événement métier.

Événement proposé :

```json
{
  "event_id": "event-001",
  "event_type": "TREATMENT_STOPPED",
  "occurred_at": "2026-11-09T10:30:00",
  "data": {
    "treatment_id": "treatment-001",
    "patient_id": "patient-001",
    "medication": "Metformine",
    "status": "STOPPED"
  }
}
```

Cet événement est une proposition de contrat. Le transport (HTTP, RabbitMQ, Kafka ou autre) reste à définir avec l'équipe.

## 3. Exemple de notification créée par Reminders

```json
{
  "id": "reminder-001",
  "patient_id": "patient-001",
  "title": "Mise à jour de votre traitement",
  "message": "Une modification de votre traitement a été enregistrée.",
  "type": "TREATMENT_UPDATE",
  "status": "PENDING",
  "created_at": "2026-11-09T10:35:00"
}
```

Ce format est illustratif et doit être adapté au modèle réel de Reminders.

## 4. Endpoints à documenter

| Fonctionnalité | Méthode | Endpoint |
|---|---|---|
| Recevoir un événement | À confirmer | À confirmer |
| Créer un rappel | À confirmer | À confirmer |
| Lister les rappels d'un patient | À confirmer | À confirmer |
| Consulter un rappel | À confirmer | À confirmer |
| Marquer un rappel comme lu | À confirmer | À confirmer |

## 5. Règles métier

- Les événements doivent être identifiables.
- Un événement reçu plusieurs fois ne doit pas provoquer plusieurs notifications identiques, si le système met en place une gestion d'idempotence.
- Reminders applique ses propres règles de création et d'envoi.
- L'arrêt d'un traitement ne doit pas entraîner automatiquement une décision médicale.

## 6. Informations à compléter

- Endpoints réels.
- Format des requêtes et réponses.
- Transport des événements.
- Types de rappels.
- Statuts disponibles.
- Gestion des doublons et des erreurs.
- Règles d'authentification.

## 7. État du contrat

**Statut : proposition à valider par le responsable de Reminders.**