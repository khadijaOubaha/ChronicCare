# Auth Service — Contrat API

## 1. Présentation

Le service Auth gère l'inscription, la connexion et l'identification des utilisateurs de ChronicCare.

Il génère un token JWT utilisé par les autres microservices pour authentifier les requêtes.

**Port connu :** `8000`

**Préfixe API :** `/api/v1/auth`

## 2. Endpoints

### 2.1 Inscription

- Méthode : `POST`
- URL : `/api/v1/auth/register`
- Authentification : non requise

**Request Body — exemple :**

```json
{
  "full_name": "Ahmed Alami",
  "email": "ahmed@example.com",
  "password": "ExamplePassword123"
}
```

**Réponse attendue :** utilisateur créé. Le format exact doit être vérifié dans le schéma de réponse du backend.

Erreurs à documenter selon le code :
- `400` ou `409` : email déjà utilisé, selon l'implémentation.
- `422` : données invalides.

### 2.2 Connexion

- Méthode : `POST`
- URL : `/api/v1/auth/login`
- Authentification : non requise

**Request Body :**

Le service utilise un mécanisme OAuth2 avec formulaire de connexion. Vérifier dans le code si l'endpoint attend `application/x-www-form-urlencoded` avec `username` et `password`, ou un JSON.

**Exemple de formulaire OAuth2 :**

```text
username=ahmed@example.com
password=ExamplePassword123
```

**Exemple de réponse JWT à confirmer :**

```json
{
  "access_token": "<JWT_TOKEN>",
  "token_type": "bearer"
}
```

### 2.3 Utilisateur connecté

- Méthode : `GET`
- URL : `/api/v1/auth/me`
- Authentification : JWT obligatoire

**Header :**

```http
Authorization: Bearer <JWT_TOKEN>
```

Cette route retourne les informations de l'utilisateur connecté. Les champs exacts de la réponse doivent être repris du backend.

## 3. Utilisation du JWT par les autres services

Le token contient notamment les informations d'identification et le rôle de l'utilisateur.

**Exemple de payload décodé :**

```json
{
  "sub": "user-123",
  "email": "ahmed@example.com",
  "role": "PATIENT",
  "exp": 1794230400
}
```

Cet exemple illustre le contenu attendu ; il ne constitue pas une réponse JSON de l'API.

## 4. Rôles

Les rôles actuellement évoqués dans le backend sont :
- `PATIENT`
- `ADMIN`

Les autorisations de chaque endpoint doivent être vérifiées dans les services consommateurs.

## 5. Communication avec les autres services

Les autres microservices valident le JWT localement avec le secret partagé et l'algorithme configuré.

Ils ne doivent pas nécessairement appeler Auth à chaque requête.

## 6. État du contrat

- Inscription : endpoint connu, réponse à confirmer.
- Connexion : endpoint connu, format de requête à confirmer.
- Profil connecté : endpoint connu, réponse à confirmer.
- JWT : validation locale prévue dans Treatments.

**Responsable :** membre de l'équipe Auth.