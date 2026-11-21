
# Contrats partagés ChronicCare

Ce dossier centralise les contrats d'échange entre les microservices du projet ChronicCare.

## 1. Événement : mesure anormale

**Fichier :** `abnormal.v1.schema.json`

**Émetteur :** Mesures Service

**Destinataire :** Reminders Service

**Type d'événement :** `measurement.abnormal`

### Description

Cet événement est envoyé lorsqu'une mesure enregistrée par un patient dépasse les seuils de surveillance configurés dans le service Mesures.

Il permet au service Reminders de recevoir les informations nécessaires pour notifier le médecin administrateur.

### Déclenchement

L'événement est envoyé après :
1. La validation des valeurs de la mesure.
2. L'enregistrement réussi de la mesure dans PostgreSQL.
3. La détection d'au moins une anomalie.

Aucun événement n'est envoyé lorsqu'aucune anomalie n'est détectée.

### Structure de l'événement

- `event_type` : type de l'événement.
- `event_version` : version du contrat.
- `event_id` : identifiant unique de l'événement.
- `occurred_at` : date et heure de création de l'événement.
- `patient_id` : identifiant du patient.
- `doctor_id` : identifiant du médecin administrateur.
- `data.patient` : informations du patient.
- `data.measurement` : informations de la mesure.
- `data.anomalies` : liste des anomalies détectées.

### Responsabilités

**Mesures Service**
- Enregistrer les mesures.
- Détecter les anomalies selon les règles configurées.
- Construire et transmettre l'événement.

**Reminders Service**
- Recevoir et vérifier l'événement.
- Traiter la notification destinée au médecin.
- Gérer l'envoi de la notification.

### Versionnement

La version actuelle du contrat est `1.0`.

Toute modification incompatible devra entraîner la création d'une nouvelle version du schéma.
