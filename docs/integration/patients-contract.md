# Patients Service — Contrat API

## 1. Présentation

Le service Patients gère les dossiers des patients : création, consultation, modification, suppression et recherche.

**Port connu :** `8001`

**Préfixe API :** `/api/v1/patients`

## 2. Structure d'un patient

Exemple de ressource :

```json
{
  "id": "bb33bef6-9e54-4c2f-a063-947542a1160e",
  "user_id": "user-123",
  "first_name": "Ahmed",
  "last_name": "Alami",
  "date_of_birth": "1985-05-12",
  "sex": "M",
  "phone": "0600000000",
  "email": "ahmed@example.com",
  "address": "Agadir",
  "is_active": true
}
```

Les champs `user_id`, `sex` et les autres contraintes doivent être confirmés dans le schéma réel.

## 3. Endpoints

### 3.1 Créer un patient

- Méthode : `POST`
- URL : `/api/v1/patients`

**Request Body — exemple à valider :**

```json
{
  "first_name": "Ahmed",
  "last_name": "Alami",
  "date_of_birth": "1985-05-12",
  "sex": "M",
  "phone": "0600000000",
  "email": "ahmed@example.com",
  "address": "Agadir"
}
```

### 3.2 Consulter un patient

- Méthode : `GET`
- URL : `/api/v1/patients/{patient_id}`

**Exemple :**

```http
GET /api/v1/patients/bb33bef6-9e54-4c2f-a063-947542a1160e
```

**Réponse :** objet Patient.

### 3.3 Lister les patients

- Méthode : `GET`
- URL : `/api/v1/patients`

**Paramètres de pagination connus :**

- `offset` : nombre d'enregistrements à ignorer.
- `limit` : nombre maximum d'enregistrements à retourner.

**Exemple :**

```http
GET /api/v1/patients?offset=0&limit=10
```

Le format exact de la réponse (liste directe ou objet paginé) doit être confirmé dans le routeur.

### 3.4 Modifier un patient

- Méthode : `PATCH`
- URL : `/api/v1/patients/{patient_id}`

Le corps contient les champs autorisés à modifier. Vérifier si les champs absents sont conservés et si `null` est accepté.

### 3.5 Supprimer un patient

- Méthode : `DELETE`
- URL : `/api/v1/patients/{patient_id}`

La réponse exacte dépend de l'implémentation (par exemple `204 No Content` ou un objet de confirmation).

## 4. Relation avec Treatments

Avant de créer un traitement, Treatments vérifie l'existence du patient en appelant :

```http
GET /api/v1/patients/{patient_id}
```

Le service Patients doit retourner :
- `200 OK` si le patient existe.
- `404 Not Found` si le patient n'existe pas.

Treatments vérifie également `is_active` pour refuser un patient inactif.

## 5. Erreurs à documenter

- `404` : patient introuvable.
- `422` : données invalides.
- `401` : token absent ou invalide, si la route est protégée.
- `403` : rôle non autorisé, si applicable.

## 6. État du contrat

Les routes CRUD et la vérification d'existence par Treatments sont connues. Les corps de requête, réponses, règles d'accès et codes exacts doivent être comparés au code actuel.

**Responsable :** membre de l'équipe Patients.