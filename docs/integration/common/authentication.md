# Common — Authentification et autorisation

## 1. Objectif

Ce document définit les règles communes d'authentification utilisées par les microservices ChronicCare.

## 2. Authentification JWT

Le service Auth génère un token JWT après une connexion réussie.

Les clients doivent transmettre ce token dans l'en-tête HTTP des requêtes protégées.

**Format :**

```http
Authorization: Bearer <JWT_TOKEN>
```

## 3. Exemple de payload JWT

```json
{
  "sub": "user-123",
  "email": "ahmed@example.com",
  "role": "PATIENT",
  "exp": 1794230400
}
```

Les champs exacts sont à confirmer avec le code du service Auth.

## 4. Validation du token

Chaque microservice protégé doit vérifier :
- La signature du token.
- L'algorithme utilisé.
- La date d'expiration.
- Les informations nécessaires à l'identification de l'utilisateur.
- Le rôle lorsque l'opération est soumise à une autorisation.

Dans l'implémentation identifiée de Treatments, le token est vérifié localement à l'aide du secret partagé.

## 5. Rôles connus

| Rôle | Description |
|---|---|
| `PATIENT` | Utilisateur patient |
| `ADMIN` | Rôle utilisé pour les opérations administratives et médicales dans les règles actuelles |

La signification exacte du rôle `ADMIN` doit être harmonisée entre les membres de l'équipe. Si le projet introduit un rôle distinct `DOCTOR`, il faudra mettre à jour les contrats et les autorisations.

## 6. Règles d'accès connues dans Treatments

| Opération | Rôle identifié |
|---|---|
| Créer un traitement | `ADMIN` |
| Consulter ses traitements | `PATIENT` |
| Consulter tous les traitements | `ADMIN` |
| Consulter un traitement | `PATIENT` propriétaire ou `ADMIN` |
| Modifier un traitement | `ADMIN` |
| Arrêter un traitement | `ADMIN` |

## 7. Sécurité

- Ne jamais transmettre le mot de passe dans les URL.
- Ne jamais enregistrer le JWT dans les logs.
- Utiliser HTTPS en environnement de production.
- Ne pas exposer le secret JWT dans le frontend.
- Vérifier les autorisations côté backend, même si le frontend masque certaines fonctionnalités.