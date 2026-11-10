# ChronicCare — Documentation des contrats d'intégration

## 1. Objectif

Ce dossier définit les contrats d'intégration entre les microservices de l'application ChronicCare.

Un contrat d'intégration précise :
- Les endpoints exposés par chaque service.
- Les méthodes HTTP utilisées.
- Les paramètres et les corps JSON.
- Les formats des réponses.
- Les mécanismes d'authentification et d'autorisation.
- Les codes HTTP et les erreurs possibles.

Cette documentation sert de référence aux développeurs backend et frontend.

## 2. Architecture concernée

Les microservices concernés sont :

| Service | Responsabilité |
|---|---|
| Auth Service | Inscription, connexion et authentification |
| Patients Service | Gestion des dossiers patients |
| Treatments Service | Gestion des traitements médicaux |
| Measurements Service | Enregistrement et consultation des mesures médicales |
| Reminders Service | Gestion des rappels et notifications |
| Teleconsultations Service | Gestion des téléconsultations |

## 3. Organisation des contrats

- `auth-contract.md` : contrat du service Auth.
- `patients-contract.md` : contrat du service Patients.
- `treatments-contract.md` : contrat du service Treatments.
- `measurements-contract.md` : contrat du service Measurements.
- `reminders-contract.md` : contrat du service Reminders.
- `teleconsultations-contract.md` : contrat du service Teleconsultations.
- `common/authentication.md` : règles communes d'authentification.
- `common/error-responses.md` : conventions de gestion des erreurs.

## 4. Conventions générales

- Format des données : JSON.
- Encodage : UTF-8.
- Communication : HTTP/HTTPS avec API REST.
- Les identifiants des ressources utilisent des UUID lorsque prévu par le service.
- Les dates sont représentées au format ISO 8601 ou `YYYY-MM-DD`, selon le champ.
- Les endpoints protégés nécessitent un token JWT, sauf indication contraire.

## 5. État de validation

Les contrats sont classés selon leur état :

- **Implémenté / à confirmer** : le mécanisme existe dans le backend, mais le contrat doit être comparé au code actuel.
- **Proposé** : intégration envisagée, pas encore confirmée dans le code.
- **À compléter** : le responsable du microservice doit fournir les endpoints et schémas réels.

Aucun contrat proposé ne doit être considéré comme une API déjà disponible.

## 6. Règle de modification

Toute modification d'un endpoint, d'un champ JSON, d'une règle d'accès ou d'un code HTTP doit être répercutée dans le fichier du service concerné et communiquée aux équipes qui consomment cette API.