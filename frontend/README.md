# ChronicCare — Frontend (Téléconsultations)

React + Vite + Tailwind (même design system que le frontend principal : palette `brand`, Inter / JetBrains Mono, composants `src/components/ui`). Écrans : liste patient, demande de rendez-vous, détails du rendez-vous,
liste médecin (demandes, planification, confirmation, fin, annulation, compte rendu).

## Lancer (PowerShell)

    # 1. Backend (depuis la racine du projet ; JWT_SECRET doit être renseigné dans .env)
    docker compose up -d --build

    # 2. Frontend
    cd frontend
    $env:JWT_SECRET = "<même valeur que dans .env>"
    npm install
    npm run dev:fake        # http://localhost:3000

`dev:fake` ajoute une **connexion de test** (le serveur de développement signe un jeton avec
`JWT_SECRET`, en attendant le service d'authentification). Ne sert qu'au développement.

Comptes de test (mot de passe libre) :
- Médecin : `medecin@test.com` (Dr. Ahlam El Fadli), `sarah.martin@test.com`,
  `jean.dupont@test.com`, `marie.lefevre@test.com`
- Patient : `<uuid-du-patient>@test.com` ou n'importe quel autre e-mail

## Règles d'interface

- **Salle** : le lien saisi par le médecin est utilisé ; sinon `https://meet.jit.si/ChronicCare-<id>`
  est calculé (aucun changement de backend).
- **« Rejoindre »** : actif de 10 min avant l'heure jusqu'à la fin (durée fixe de 30 min) ;
  le badge « En direct » apparaît pendant la consultation.
- **Demande du patient** : `POST /api/v1/teleconsultations/requests` (statut `REQUESTED`) ;
  le médecin confirme (`PATCH /{id}/confirm`) ou refuse.
- `src/data/doctors.js` : annuaire de développement (spécialité, note, cabinet). Le service ne
  stocke que `doctor_id` ; à remplacer par une API quand elle existera.
- Liste des patients (formulaire « Planifier ») : lue sur le Patients Service (port 8001) ;
  à défaut, saisie de l'UUID.
