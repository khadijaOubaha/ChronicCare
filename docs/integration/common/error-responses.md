# Common — Gestion des erreurs API

## 1. Objectif

Ce document définit les principales catégories d'erreurs HTTP que les microservices ChronicCare peuvent retourner.

Les formats JSON présentés ci-dessous sont des formats recommandés. Ils doivent être harmonisés avec les réponses réelles des services.

## 2. Codes HTTP

| Code | Signification | Exemple |
|---|---|---|
| `200` | OK | Ressource consultée |
| `201` | Created | Ressource créée |
| `204` | No Content | Suppression réussie sans contenu |
| `400` | Bad Request | Requête incorrecte |
| `401` | Unauthorized | Token absent, invalide ou expiré |
| `403` | Forbidden | Rôle non autorisé |
| `404` | Not Found | Ressource introuvable |
| `409` | Conflict | Conflit métier |
| `422` | Unprocessable Entity | Validation des données échouée |
| `500` | Internal Server Error | Erreur interne |
| `502` | Bad Gateway | Réponse invalide d'un service dépendant |
| `503` | Service Unavailable | Service indisponible |

## 3. Format JSON recommandé

Exemple d'erreur :

```json
{
  "detail": "Patient introuvable"
}
```

Autre exemple de format standardisé, si l'équipe décide de l'adopter :

```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient introuvable"
  }
}
```

Ces deux formats sont des exemples alternatifs. Les services doivent utiliser le format réellement défini dans leur backend.

## 4. Gestion côté frontend

Le frontend doit prévoir :
- `401` : demander à l'utilisateur de se reconnecter.
- `403` : afficher un message d'accès refusé.
- `404` : afficher une ressource introuvable.
- `409` : afficher le conflit métier retourné.
- `422` : afficher les erreurs de validation du formulaire.
- `500`, `502`, `503` : afficher un message d'erreur serveur et proposer de réessayer lorsque c'est approprié.

## 5. Règle commune

Chaque microservice doit documenter les codes HTTP réellement retournés par ses endpoints. Le frontend ne doit pas supposer qu'une réponse d'erreur possède un format qui n'est pas garanti par le backend.