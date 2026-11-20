# ChronicCare — Frontend

Application frontend de ChronicCare construite avec React, Vite et Tailwind CSS.

## Démarrage

Depuis la racine du projet :

```bash
docker compose up -d --build
```

Puis, dans le dossier `frontend` :

```bash
npm install
npm run dev
```

Le frontend est accessible à l'adresse indiquée par Vite (généralement `http://localhost:5173`).

## Services backend

Le frontend communique avec les services suivants :

- Auth : port 8000
- Patients : port 8001
- Treatments : port 8002
- Teleconsultations : port 8004

Les URL des services sont configurées dans `vite.config.js`.

**Sécurité :** les secrets JWT doivent rester dans le fichier `.env` à la racine du projet. Ne place jamais `JWT_SECRET_KEY` dans le code frontend ni dans une variable `VITE_*`.

## Fonctionnalités

### Espace patient
- Tableau de bord
- Suivi des traitements
- Consultation des informations médicales
- Demande de téléconsultation
- Consultation des rendez-vous

### Espace médecin
- Tableau de bord
- Gestion des patients
- Gestion des prescriptions
- Consultation des demandes de téléconsultation
- Planification et suivi des rendez-vous

### Fonctionnalités communes
- Authentification
- Gestion des rôles et des accès
- Profil utilisateur
- Téléconsultations

## Téléconsultations

Les écrans de téléconsultation comprennent :

- Liste des rendez-vous côté patient
- Demande de rendez-vous
- Détails d'une téléconsultation
- Liste des demandes côté médecin
- Planification, confirmation et annulation
- Compte rendu de consultation

Le frontend communique avec le Teleconsultations Service via `/api/v1/teleconsultations`.

## Structure du projet

- `src/api/` : clients HTTP et communication avec les services
- `src/auth/` : authentification, gestion des jetons et rôles
- `src/components/` : composants réutilisables
- `src/features/` : fonctionnalités métier
- `src/layouts/` : mises en page
- `src/pages/` : pages de l'application
- `src/hooks/` : hooks React
- `src/utils/` : fonctions utilitaires

## Technologies

- React
- Vite
- React Router
- Tailwind CSS
- Axios
- Lucide React