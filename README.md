# ChronicCare — Plateforme de suivi des maladies chroniques

**ChronicCare** est une plateforme de gestion et de suivi des patients atteints de maladies chroniques. Elle vise à centraliser les informations médicales utiles, faciliter le suivi des traitements et des mesures de santé, et améliorer la coordination entre les patients et les professionnels de santé.

Le projet est développé en équipe selon une architecture en microservices, avec une approche progressive : chaque membre développe un service clairement défini, tout en respectant les conventions communes du projet.

---

## 1. Objectifs du projet

Les objectifs de ChronicCare sont de :

- Gérer les informations des patients.
- Organiser les traitements et leur suivi.
- Enregistrer et consulter les mesures de santé.
- Planifier les rappels liés aux traitements et au suivi médical.
- Organiser les téléconsultations.
- Fournir une interface web accessible et intuitive.
- Garantir une architecture maintenable, testable et évolutive.
- Automatiser les vérifications et les déploiements à l'aide de pratiques DevOps.

**Important :** ChronicCare est un projet logiciel de suivi. Les informations et fonctionnalités développées ne remplacent pas un diagnostic ou une décision médicale.

## 2. Technologies utilisées

| Composant | Technologie |
|---|---|
| Frontend | React |
| Backend | Python avec FastAPI |
| Base de données | PostgreSQL |
| Conteneurisation | Docker |
| Orchestration locale | Docker Compose |
| Gestion de versions | Git et GitHub |
| CI/CD | GitHub Actions |
| Tests backend | Pytest et FastAPI TestClient |

Les versions et dépendances exactes seront documentées au fur et à mesure de leur validation dans le dépôt.

## 3. Architecture générale

L'application est organisée en plusieurs composants indépendants :

```text
                    UTILISATEUR
                         |
                         v
                  FRONTEND REACT
                         |
              Requêtes HTTP / REST
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
  Patients Service  Treatments Service  Measurements Service
       |                 |                  |
       +-----------------+------------------+
                         |
              PostgreSQL partagé
                         |
       +-----------------+------------------+
       |                                    |
       v                                    v
 Reminders Service                  Teleconsultations Service
```

Ce schéma représente une vue logique simplifiée. Les modalités exactes de communication entre services, notamment les appels interservices, seront définies avant leur intégration.

### Principes d'architecture

- Chaque microservice possède une responsabilité fonctionnelle précise.
- Chaque service expose sa propre API REST avec FastAPI.
- Les services sont développés et testés indépendamment.
- PostgreSQL est partagé au niveau de l'infrastructure, mais les tables et les règles métier sont attribuées à un service propriétaire.
- Un service ne doit pas modifier directement les tables métier appartenant à un autre service.
- Docker Compose permet de lancer les composants nécessaires à l'environnement local.
- Les contrats d'API doivent être documentés afin de faciliter l'intégration.

**Choix concernant la base de données :** pour la première version, le projet utilise une instance PostgreSQL partagée. Chaque service reste responsable de ses propres tables. L'utilisation éventuelle de schémas séparés, les migrations et les accès entre services seront définis dans les conventions techniques de l'équipe.

## 4. Microservices et responsabilités

### 4.1 Patients Service

**Responsabilité :** gérer les informations administratives et le profil des patients.

Fonctionnalités prévues :

- Créer un patient.
- Consulter un patient.
- Lister les patients avec pagination.
- Modifier les informations d'un patient.
- Supprimer ou désactiver un patient selon les règles métier retenues.
- Valider les données reçues par l'API.

Exemples d'endpoints envisagés :

| Méthode | Endpoint | Objectif |
|---|---|---|
| GET | `/health` | Vérifier l'état du service |
| POST | `/api/v1/patients` | Créer un patient |
| GET | `/api/v1/patients` | Lister les patients |
| GET | `/api/v1/patients/{patient_id}` | Consulter un patient |
| PUT | `/api/v1/patients/{patient_id}` | Modifier un patient |
| DELETE | `/api/v1/patients/{patient_id}` | Supprimer un patient |

Ces endpoints constituent la convention cible ; ils doivent être implémentés et testés avant d'être considérés comme disponibles.

### 4.2 Treatments Service

**Responsabilité :** gérer les traitements associés aux patients.

Fonctionnalités prévues :

- Créer et modifier un traitement.
- Associer un traitement à un patient à partir de son identifiant.
- Enregistrer les informations de prescription prévues par le périmètre du projet.
- Consulter les traitements d'un patient.
- Gérer le statut d'un traitement.

Ce service ne doit pas être utilisé pour établir ou modifier une prescription médicale réelle sans les contrôles et validations appropriés.

### 4.3 Measurements Service

**Responsabilité :** enregistrer et consulter les mesures de santé des patients.

Fonctionnalités prévues :

- Enregistrer une mesure.
- Associer une mesure à un patient.
- Stocker le type de mesure, la valeur, l'unité et la date.
- Consulter l'historique des mesures.
- Préparer des données pour visualiser les évolutions dans le temps.

Les types de mesures et leurs unités devront être définis et validés collectivement.

### 4.4 Reminders Service

**Responsabilité :** gérer les rappels destinés aux patients.

Fonctionnalités prévues :

- Créer un rappel.
- Définir une date, une heure et une fréquence si nécessaire.
- Consulter les rappels.
- Modifier, désactiver ou supprimer un rappel.
- Préparer la gestion de l'état des rappels et de leur exécution.

Le mécanisme de planification et les canaux de notification seront précisés lors de la conception technique.

### 4.5 Teleconsultations Service

**Responsabilité :** organiser et gérer les informations relatives aux téléconsultations.

Fonctionnalités prévues :

- Planifier une téléconsultation.
- Associer une consultation à un patient et à un professionnel.
- Consulter les rendez-vous.
- Modifier ou annuler un rendez-vous.
- Gérer les statuts d'une consultation.

La visioconférence elle-même pourra nécessiter une solution complémentaire ; elle ne doit pas être considérée comme déjà intégrée.

## 5. Organisation du dépôt

Organisation cible proposée :

```text
ChronicCare/
├── frontend/
├── services/
│   ├── patients-service/
│   ├── treatments-service/
│   ├── measurements-service/
│   ├── reminders-service/
│   └── teleconsultations-service/
├── tests/
├── docs/
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

Chaque service backend devra suivre une structure cohérente, par exemple :

```text
patients-service/
├── app/
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   └── main.py
├── tests/
├── requirements.txt
├── Dockerfile
└── .dockerignore
```

Cette structure est une cible d'organisation. Les dossiers seront ajoutés progressivement lorsqu'ils seront nécessaires.

## 6. Conventions communes de développement

### API REST

- Utiliser des noms de ressources au pluriel.
- Utiliser des méthodes HTTP adaptées : GET, POST, PUT/PATCH et DELETE.
- Versionner les routes métier avec le préfixe `/api/v1`.
- Fournir des réponses JSON cohérentes.
- Utiliser des codes HTTP appropriés : 200, 201, 204, 400, 404, 422 et 500 selon le cas.
- Valider les données avec les schémas Pydantic.
- Documenter les endpoints avec OpenAPI/Swagger.
- Ne jamais exposer les mots de passe, les secrets ou les informations sensibles dans les réponses et les logs.

### Base de données

- Utiliser des migrations versionnées.
- Définir un service propriétaire pour chaque table métier.
- Prévoir les contraintes, les index et les relations nécessaires.
- Utiliser des variables d'environnement pour la configuration.
- Ne jamais committer de fichier `.env` contenant des secrets.
- Ne pas effectuer de modifications manuelles non documentées sur la base partagée.

### Qualité du code

- Écrire des fonctions courtes et lisibles.
- Séparer les routes, la logique métier, les schémas et l'accès aux données.
- Ajouter des tests pour les fonctionnalités importantes.
- Traiter correctement les erreurs.
- Maintenir la documentation à jour.

## 7. Environnement local et ports

Les ports ci-dessous sont les ports de développement proposés pour l'équipe. Ils devront être confirmés dans la configuration Docker Compose commune.

| Composant | Port local proposé |
|---|---:|
| Frontend React | 3000 |
| Patients Service | 8001 |
| Treatments Service | 8002 |
| Measurements Service | 8003 |
| Reminders Service | 8004 |
| Teleconsultations Service | 8005 |
| PostgreSQL | 5433 |

Le dépôt dispose actuellement d'un environnement Docker Compose avec PostgreSQL et le Patients Service. Les autres services et le frontend seront ajoutés progressivement.

### Démarrer le projet

Prérequis : Git, Docker Desktop et Docker Compose.

Après avoir récupéré le dépôt :

```bash
git clone https://github.com/khadijaOubaha/ChronicCare.git
cd ChronicCare
```

Créer un fichier `.env` local à partir de `.env.example`, lorsque ce dernier sera disponible, puis démarrer les services :

```bash
docker compose config
docker compose up -d --build
docker compose ps
```

Pour arrêter les services :

```bash
docker compose down
```

Pour consulter les logs :

```bash
docker compose logs -f
```

Pour accéder à la documentation du Patients Service, une fois celui-ci démarré :

`http://localhost:8001/docs`

Ne pas utiliser `docker compose down -v` sans comprendre son effet : cette commande peut supprimer les volumes de données du projet.

## 8. Git et organisation du travail en équipe

### Branches

- `main` : version stable du projet.
- `develop` : branche d'intégration des fonctionnalités.
- `feature/<nom>` : nouvelle fonctionnalité.
- `fix/<nom>` : correction d'un problème.

Exemples :

```text
feature/patients-crud
feature/treatments-api
feature/measurements-api
feature/reminders
feature/teleconsultations
fix/patients-validation
```

### Workflow recommandé

1. Synchroniser sa branche locale avec `develop`.
2. Créer une branche dédiée à sa fonctionnalité.
3. Développer et tester localement.
4. Vérifier que le code ne contient aucun secret.
5. Effectuer des commits clairs.
6. Pousser la branche sur GitHub.
7. Ouvrir une Pull Request vers `develop`.
8. Vérifier les tests et obtenir une revue de code.
9. Fusionner après validation.

Exemples de messages de commit :

```text
feat(patients): add patient creation endpoint
test(patients): add API tests
fix(treatments): validate patient reference
docs: update service architecture
```

Il est recommandé de protéger les branches principales et de faire passer les modifications par des Pull Requests.

## 9. CI/CD et qualité

La chaîne CI/CD sera mise en place progressivement avec GitHub Actions.

Vérifications envisagées :

- Installation des dépendances.
- Vérification de la syntaxe et de la qualité du code.
- Exécution des tests automatisés.
- Construction des images Docker.
- Vérification de la cohérence de la configuration Docker Compose.

Le déploiement automatisé sera défini ultérieurement. Aucun déploiement en production ne doit être considéré comme opérationnel avant sa configuration et sa validation.

## 10. Contrats et intégration entre les services

Avant d'intégrer les microservices, l'équipe devra définir :

- Les identifiants communs utilisés pour référencer un patient.
- Les formats des requêtes et réponses JSON.
- Les règles de validation.
- Les codes d'erreur.
- Les responsabilités de chaque service concernant les données.
- Les mécanismes d'authentification et d'autorisation.
- Les éventuels appels interservices et leur gestion des erreurs.

Un service peut référencer un patient au moyen de son identifiant, mais ne doit pas modifier directement les tables du Patients Service.

Les contrats seront documentés dans le dossier `docs/` avant les intégrations qui en dépendent.

## 11. Sécurité et confidentialité

Les données de santé sont sensibles. Le développement devra respecter les principes suivants :

- Utiliser uniquement des données fictives pour les tests et les démonstrations.
- Ne pas publier de données personnelles ou médicales réelles dans GitHub.
- Protéger les secrets et les variables d'environnement.
- Prévoir une authentification et des autorisations adaptées avant tout usage réel.
- Limiter l'accès aux informations selon les rôles.
- Éviter de journaliser des données médicales sensibles.
- Définir les règles de conservation et de suppression des données.

Le projet devra faire l'objet d'une analyse de sécurité et de conformité avant tout usage en conditions réelles.

## 12. Plan de réalisation

Le projet sera développé par étapes :

1. **Cadrage technique :** architecture, conventions, contrats d'API et responsabilités.
2. **Socle commun :** Docker Compose, PostgreSQL, configuration et conventions Git.
3. **Développement des services :** réalisation indépendante de chaque microservice.
4. **Tests :** tests unitaires, tests d'API et tests d'intégration.
5. **Frontend :** intégration progressive des API.
6. **CI/CD :** automatisation des tests et de la construction des images.
7. **Intégration finale :** validation des échanges et des scénarios complets.

Chaque service sera considéré comme prêt à intégrer lorsqu'il disposera d'une API documentée, de validations, de tests et d'instructions de démarrage.

## 13. Contribution

Avant de commencer une fonctionnalité, chaque membre doit :

- Lire ce README et les documents techniques concernés.
- Confirmer le périmètre de son service.
- Respecter les conventions d'API et de base de données.
- Éviter de modifier les fichiers ou tables d'un autre service sans accord.
- Ajouter ou mettre à jour les tests et la documentation.
- Utiliser une Pull Request pour intégrer ses changements.

Toute modification de l'architecture ou des contrats communs doit être discutée et documentée avec l'équipe.

---

**Dépôt GitHub :** https://github.com/khadijaOubaha/ChronicCare

**Statut actuel :** socle Docker en cours de mise en place ; PostgreSQL et le conteneur du Patients Service sont démarrés. Les autres microservices, le frontend et la CI/CD restent à réaliser et à valider.
