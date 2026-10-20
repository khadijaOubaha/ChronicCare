# ChronicCare — Architecture technique

**Statut :** document de référence initial  
**Backend :** FastAPI (Python)  
**Frontend :** React  
**Base de données :** PostgreSQL  
**Conteneurisation :** Docker et Docker Compose

---

## 1. Objectif

ChronicCare est une application de suivi des soins chroniques.
Elle vise à organiser les informations relatives aux patients,
aux traitements, aux mesures de santé, aux rappels et aux téléconsultations.

Ce document définit les conventions techniques communes afin que
les membres de l'équipe développent des services compatibles entre eux.

Les décisions indiquées comme proposées doivent être validées par
l'équipe avant de devenir des contrats définitifs.

## 2. Architecture générale

Le système est organisé autour d'un frontend React et de plusieurs
services backend indépendants développés avec FastAPI.

```text
Utilisateur
    |
    v
Frontend React
    |
    +------> Patients Service
    +------> Treatments Service
    +------> Measurements Service
    +------> Reminders Service
    +------> Teleconsultations Service
                    |
                    v
             PostgreSQL partagé
```

Cette architecture représente la cible prévue. Les communications
entre services seront réalisées par API HTTP lorsque nécessaire.

PostgreSQL est initialement partagé pour simplifier le développement.
Chaque service reste responsable de ses propres tables et migrations.

## 3. Services et ports

| Composant | Port local | Responsabilité |
|---|---:|---|
| Frontend React | 3000 | Interface utilisateur |
| Patients Service | 8001 | Gestion des patients |
| Treatments Service | 8002 | Gestion des traitements |
| Measurements Service | 8003 | Enregistrement des mesures |
| Reminders Service | 8004 | Gestion des rappels |
| Teleconsultations Service | 8005 | Gestion des téléconsultations |
| PostgreSQL | 5433 | Stockage des données |

Les ports ci-dessus constituent la convention prévue.
À ce stade, seul le service Patients et PostgreSQL sont démarrés.
Les autres services seront ajoutés progressivement.

Dans Docker Compose, les services backend doivent communiquer avec
PostgreSQL via le nom du service Docker `postgres` et le port interne
`5432`, et non via `localhost:5433`.

Le port `5433` sert aux connexions depuis la machine hôte.

## 4. Responsabilités fonctionnelles

### 4.1 Patients Service

- Créer, consulter, modifier et supprimer un patient selon les règles métier.
- Être la source de référence pour l'identité et les informations du patient.
- Fournir une API permettant aux autres services de vérifier un patient.

### 4.2 Treatments Service

- Gérer les traitements prescrits et leurs informations associées.
- Référencer le patient concerné à l'aide de son identifiant.
- Ne pas modifier directement les données du Patients Service.

### 4.3 Measurements Service

- Enregistrer les mesures de santé autorisées par le projet.
- Associer chaque mesure à un patient.
- Conserver les dates, unités et valeurs nécessaires à leur interprétation.

### 4.4 Reminders Service

- Gérer les rappels liés aux traitements, aux mesures ou aux rendez-vous.
- Suivre leur date, leur état et leur historique lorsque nécessaire.

### 4.5 Teleconsultations Service

- Gérer les informations et le suivi des téléconsultations.
- Référencer les patients et les rendez-vous concernés.
- Protéger les données sensibles liées aux consultations.

## 5. Contrats communs des API

### 5.1 Conventions HTTP

- Utiliser des API REST au format JSON.
- Préfixer les routes métier par `/api/v1`.
- Exposer `/health` pour vérifier l'état du service.
- Exposer `/docs` pour consulter la documentation OpenAPI de FastAPI.
- Utiliser les méthodes HTTP selon leur sémantique :
  - `GET` : consulter ;
  - `POST` : créer ;
  - `PUT` ou `PATCH` : modifier ;
  - `DELETE` : supprimer.

Exemples de routes prévues pour le Patients Service :

- `GET /api/v1/patients`
- `GET /api/v1/patients/{patient_id}`
- `POST /api/v1/patients`
- `PATCH /api/v1/patients/{patient_id}`
- `DELETE /api/v1/patients/{patient_id}`

Ces routes constituent la convention cible, pas la garantie qu'elles
sont toutes déjà implémentées.

### 5.2 Formats des données

- Utiliser des noms de champs explicites et cohérents.
- Utiliser le format ISO 8601 pour les dates et heures.
- Inclure le fuseau horaire lorsqu'il est pertinent.
- Documenter les unités de toutes les mesures de santé.
- Valider les données reçues avec des schémas Pydantic.
- Ne jamais renvoyer de secrets ou de données sensibles inutiles.

Exemple de réponse JSON :

```json
{
  "data": {
    "id": "identifiant-du-patient",
    "status": "active"
  }
}
```

La structure définitive des ressources sera documentée avec chaque service.

### 5.3 Erreurs HTTP

Toutes les API doivent utiliser des codes HTTP appropriés :

- `400` : requête invalide ;
- `401` : authentification nécessaire ou invalide ;
- `403` : accès interdit ;
- `404` : ressource introuvable ;
- `409` : conflit avec l'état existant ;
- `422` : données invalides ;
- `500` : erreur interne du serveur.

Les réponses d'erreur doivent être compréhensibles et ne pas exposer
de traces internes, de mots de passe ou de détails de connexion.

## 6. Identifiants et relations entre services

**Convention proposée :** utiliser des UUID comme identifiants des
patients et des ressources partagées entre services.

L'équipe doit confirmer cette décision avant de figer les modèles
de données et les migrations.

Lorsqu'un autre service référence un patient, il conserve son
identifiant et utilise l'API du Patients Service pour vérifier
les informations nécessaires.

Un service ne doit pas écrire directement dans les tables métier
d'un autre service. Le partage du serveur PostgreSQL ne signifie pas
que les responsabilités sur les données sont partagées.

Chaque service possède ses propres migrations et reste responsable
de l'intégrité de ses données.

## 7. Organisation recommandée des services

Chaque service backend doit suivre une structure cohérente, adaptée
à sa taille :

```text
services/
  patients-service/
    app/
      main.py
      api/
      schemas/
      models/
      services/
      repositories/
      core/
    tests/
    migrations/
    requirements.txt
    Dockerfile
    .dockerignore
```

Les dossiers peuvent être ajoutés progressivement. Il n'est pas
nécessaire de créer des dossiers vides avant d'en avoir besoin.

- `main.py` : création de l'application FastAPI.
- `api/` : routes HTTP.
- `schemas/` : schémas de validation et de réponse.
- `models/` : modèles de données.
- `services/` : logique métier.
- `repositories/` : accès aux données si cette couche est utilisée.
- `core/` : configuration et composants transverses.
- `tests/` : tests automatisés.
- `migrations/` : évolution du schéma de base de données.

## 8. PostgreSQL et migrations

- Utiliser les variables d'environnement pour la configuration.
- Ne pas écrire de mot de passe directement dans le code.
- Ne jamais versionner le fichier `.env` réel.
- Fournir un `.env.example` sans secret réel.
- Versionner les migrations de base de données.
- Tester les migrations sur une base de développement.
- Prévoir les sauvegardes avant toute opération destructive.

L'utilisation d'Alembic pour gérer les migrations des services FastAPI
est recommandée. La stratégie de connexion et les dépendances Python
seront fixées lors de l'implémentation de chaque service.

## 9. Docker et exécution locale

- Utiliser un Dockerfile pour chaque service backend.
- Utiliser Docker Compose pour démarrer les composants nécessaires.
- Définir des healthchecks lorsque cela est pertinent.
- Garder les ports de développement locaux liés à `127.0.0.1`
  lorsqu'ils ne doivent pas être accessibles depuis le réseau.
- Ne pas supprimer les volumes de données sans vérifier leur contenu.
- Ne pas utiliser `docker compose down -v` sans avoir compris que
  cette commande peut supprimer les volumes du projet.

Commandes principales :

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f patients-service
docker compose logs -f postgres
```

## 10. Sécurité et données de santé

Les données de santé sont sensibles. Avant d'utiliser des données
réelles, l'équipe doit prévoir :

- une authentification robuste ;
- une autorisation vérifiée côté serveur ;
- une séparation des rôles et des permissions ;
- la validation des entrées ;
- la protection des secrets et des connexions ;
- des journaux sans données médicales sensibles inutiles ;
- des sauvegardes et une politique de conservation adaptées ;
- des données fictives pour les tests et les démonstrations.

Les endpoints de développement ne doivent pas être considérés comme
sécurisés simplement parce qu'ils fonctionnent en local.

## 11. Tests et qualité

Chaque service doit disposer de tests adaptés à ses fonctionnalités :

- tests unitaires de la logique métier ;
- tests des endpoints HTTP ;
- tests de validation des données ;
- tests d'intégration avec PostgreSQL lorsque nécessaire.

Avant une pull request, chaque développeur doit :

1. Exécuter les tests disponibles.
2. Vérifier que son service démarre.
3. Vérifier les changements avec `git diff`.
4. Mettre à jour la documentation si le contrat d'API change.

L'intégration continue avec GitHub Actions sera ajoutée progressivement.

## 12. Organisation Git

Branches principales :

- `main` : version stable ;
- `develop` : branche d'intégration ;
- `feature/<nom>` : nouvelle fonctionnalité ;
- `fix/<nom>` : correction.

Exemple de workflow :

```powershell
git switch develop
git pull origin develop
git switch -c feature/patients-crud

# Développer et tester les modifications

git add .
git commit -m "feat(patients): implement patient CRUD"
git push -u origin feature/patients-crud
```

Les nouvelles fonctionnalités doivent être proposées par pull request
vers `develop`. Ne pas pousser directement sur `main`.

Éviter `git add .` si le dépôt contient des fichiers temporaires ou
des secrets ; vérifier `git status` avant chaque commit.

## 13. Definition of Done

Une fonctionnalité est considérée comme terminée lorsque :

- le code respecte les conventions communes ;
- les validations et les erreurs HTTP sont gérées ;
- les tests pertinents passent ;
- les migrations nécessaires sont versionnées ;
- le service démarre avec la configuration documentée ;
- la documentation est mise à jour ;
- aucun secret ou fichier local sensible n'est commité ;
- la pull request a été revue et acceptée.

## 14. État actuel et prochaines étapes

État initial :

- dépôt GitHub et branche `develop` disponibles ;
- documentation générale dans `README.md` ;
- PostgreSQL démarré avec Docker Compose ;
- squelette FastAPI du Patients Service démarré ;
- autres services à implémenter.

Prochaines étapes :

1. Faire valider les conventions de ce document par l'équipe.
2. Confirmer les identifiants UUID et la stratégie de migrations.
3. Définir le modèle Patient et ses règles de validation.
4. Implémenter et tester le CRUD du Patients Service.
5. Ajouter les autres services un par un.
6. Ajouter les tests et GitHub Actions.
7. Définir l'authentification et les autorisations avant tout usage
   de données de santé réelles.
