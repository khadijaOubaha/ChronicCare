# Teleconsultations Service — Contrat API

## 1. Présentation

Le service Teleconsultations gère les consultations médicales à distance entre les patients et les médecins.

Il peut avoir besoin d'informations provenant des autres services, notamment les dossiers patients, les traitements et les mesures médicales.

**Port :** à confirmer.

**Préfixe API :** à confirmer.

**Responsable :** membre de l'équipe Teleconsultations.

## 2. Relation avec Treatments

Pendant une consultation, le médecin peut avoir besoin de consulter les traitements du patient.

Endpoint Treatments concerné :

```http
GET /api/v1/patients/{patient_id}/treatments
```

Cette route est actuellement réservée au rôle `ADMIN`. L'accès par Teleconsultations nécessite donc une règle d'autorisation adaptée.

## 3. Exemple de traitement consulté

```json
{
  "id": "treatment-001",
  "patient_id": "patient-001",
  "medication": "Metformine",
  "dosage": "500 mg",
  "frequency": "2 fois par jour",
  "status": "ACTIVE"
}
```

Cet exemple illustre les informations que le médecin pourrait consulter pendant la téléconsultation.

## 4. Relation avec Patients

Teleconsultations peut avoir besoin d'identifier le patient concerné par une consultation à partir de son identifiant.

L'équipe doit préciser si elle appelle directement Patients ou utilise des informations déjà disponibles dans son propre service.

## 5. Relation avec Measurements

Pendant la consultation, le médecin peut avoir besoin de consulter les dernières mesures et leur historique.

Le service Measurements doit fournir les endpoints et les formats réels de ces données.

## 6. Prescription pendant une téléconsultation

Si le médecin décide de créer un traitement, Teleconsultations peut transmettre la prescription au service Treatments.

Endpoint proposé à réutiliser :

```http
POST /api/v1/treatments
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

Exemple de corps :

```json
{
  "patient_id": "patient-001",
  "disease": "TYPE_2_DIABETES",
  "medication": "Metformine",
  "dosage": "500 mg",
  "frequency": "2 fois par jour",
  "start_date": "2026-11-09",
  "end_date": null,
  "instructions": "À prendre après les repas"
}
```

Attention : la création dans Treatments est actuellement réservée au rôle `ADMIN`. Il faut valider que le rôle et le contexte d'authentification du médecin permettent cette opération.

## 7. Endpoints propres à Teleconsultations

| Fonctionnalité | Méthode | Endpoint |
|---|---|---|
| Créer une téléconsultation | À confirmer | À confirmer |
| Consulter une téléconsultation | À confirmer | À confirmer |
| Lister les téléconsultations | À confirmer | À confirmer |
| Modifier une téléconsultation | À confirmer | À confirmer |
| Annuler une téléconsultation | À confirmer | À confirmer |

## 8. Informations à compléter

- Endpoints réels.
- Schémas JSON.
- Rôles et autorisations.
- Statuts des consultations.
- Gestion des rendez-vous.
- Gestion des liens ou sessions vidéo.
- Intégration avec Patients, Measurements et Treatments.

## 9. État du contrat

**Statut : proposition à valider par le responsable de Teleconsultations.**