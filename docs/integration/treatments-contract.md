# Treatments Service — Contrat API

## 1. Présentation

Le service Treatments gère les traitements médicaux prescrits aux patients atteints de maladies chroniques.

Il permet de créer, consulter, modifier et arrêter un traitement.

**Port connu :** `8002`

**Préfixe API :** `/api/v1`

## 2. Structure d'un traitement

```json
{
  "id": "treatment-001",
  "patient_id": "bb33bef6-9e54-4c2f-a063-947542a1160e",
  "prescribed_by": "user-123",
  "disease": "TYPE_2_DIABETES",
  "medication": "Metformine",
  "dosage": "500 mg",
  "frequency": "2 fois par jour",
  "start_date": "2026-11-09",
  "end_date": null,
  "instructions": "À prendre après les repas",
  "status": "ACTIVE",
  "created_at": "2026-11-09T10:00:00",
  "updated_at": "2026-11-09T10:00:00"
}
```

Les valeurs d'exemple ne remplacent pas les valeurs et champs définis dans les schémas Pydantic.

## 3. Endpoints

### 3.1 Créer un traitement

- Méthode : `POST`
- URL : `/api/v1/treatments`
- Authentification : JWT obligatoire.
- Rôle : `ADMIN` selon les règles actuelles.

**Request Body :**

```json
{
  "patient_id": "bb33bef6-9e54-4c2f-a063-947542a1160e",
  "disease": "TYPE_2_DIABETES",
  "medication": "Metformine",
  "dosage": "500 mg",
  "frequency": "2 fois par jour",
  "start_date": "2026-11-09",
  "end_date": null,
  "instructions": "À prendre après les repas"
}
```

Le champ `prescribed_by` est déterminé à partir de l'utilisateur authentifié, et non fourni librement par le frontend, selon le fonctionnement actuel.

**Réponses à documenter :**
- `201` : traitement créé.
- `401` : authentification invalide.
- `403` : rôle non autorisé.
- `404` : patient inexistant.
- `409` : patient inactif.
- `422` : données invalides.
- `502` ou `503` : erreur ou indisponibilité du Patients Service, selon le cas.

### 3.2 Consulter les traitements du patient connecté

- Méthode : `GET`
- URL : `/api/v1/treatments/me`
- Authentification : JWT obligatoire.

Cette route permet à un patient de consulter ses propres traitements. Un utilisateur `ADMIN` peut consulter l'ensemble des traitements selon la logique actuelle.

### 3.3 Consulter un traitement par son identifiant

- Méthode : `GET`
- URL : `/api/v1/treatments/{treatment_id}`
- Authentification : JWT obligatoire.

Règles :
- Un patient peut consulter uniquement son propre traitement.
- Un `ADMIN` peut consulter les traitements de tous les patients.

### 3.4 Consulter les traitements d'un patient

- Méthode : `GET`
- URL : `/api/v1/patients/{patient_id}/treatments`
- Authentification : JWT obligatoire.
- Rôle : `ADMIN` selon les règles actuelles.

Cette route permet de consulter les traitements associés à un patient précis.

### 3.5 Modifier un traitement

- Méthode : `PATCH`
- URL : `/api/v1/treatments/{treatment_id}`
- Authentification : JWT obligatoire.
- Rôle : `ADMIN`.

Règle métier connue : un traitement doit être `ACTIVE` pour être modifié.

Le corps de la requête contient uniquement les champs modifiables prévus par le schéma.

### 3.6 Arrêter un traitement

- Méthode : `PATCH`
- URL : `/api/v1/treatments/{treatment_id}/stop`
- Authentification : JWT obligatoire.
- Rôle : `ADMIN`.

Cette opération change le statut du traitement en `STOPPED`, selon les règles métier du service.

## 4. Valeurs métier

### 4.1 Maladies

Les valeurs identifiées dans le modèle :
- `TYPE_2_DIABETES`
- `HYPERTENSION`

### 4.2 Statuts

- `ACTIVE` : traitement en cours.
- `COMPLETED` : traitement terminé.
- `STOPPED` : traitement arrêté.

## 5. Relation avec les autres services

### Auth Service

Treatments vérifie localement le JWT avec le secret partagé et l'algorithme configuré. Il récupère l'identifiant et le rôle de l'utilisateur.

### Patients Service

Avant la création d'un traitement, Treatments appelle :

```http
GET /api/v1/patients/{patient_id}
```

Il vérifie que le patient existe et qu'il est actif.

### Measurements Service

Measurements enregistre les mesures médicales, tandis que Treatments conserve les prescriptions. Les deux ensembles de données peuvent être affichés ensemble dans le dossier du patient.

L'intégration directe entre les deux services reste à définir.

### Reminders Service

Treatments peut publier un événement tel que `TREATMENT_STOPPED` lorsqu'un traitement est arrêté. Le format et le mécanisme de transmission restent à définir.

### Teleconsultations Service

Teleconsultations peut avoir besoin de consulter les traitements et de transmettre une prescription à Treatments. Les autorisations et l'intégration doivent être validées entre les deux équipes.

## 6. Règles de sécurité

- Un token JWT valide est obligatoire pour les routes protégées.
- Le rôle doit être vérifié avant chaque opération.
- Un patient ne peut consulter que ses propres traitements.
- La création, la modification et l'arrêt sont réservés à `ADMIN` dans les règles actuelles.
- L'identifiant du prescripteur est déterminé à partir du token.

## 7. État du contrat

Les endpoints et règles métier ci-dessus correspondent à l'implémentation identifiée pendant le travail sur Treatments. Les réponses JSON exactes et les champs de chaque PATCH doivent être confirmés avec les schémas et le routeur actuels.

**Responsable :** Khadija — Treatments Service.