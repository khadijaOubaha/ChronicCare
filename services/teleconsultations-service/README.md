# Teleconsultations Service

Service FastAPI de gestion des téléconsultations (ChronicCare). Port : 8005.

## Authentification

Toutes les routes sauf `/health` exigent un jeton JWT (`Authorization: Bearer ...`)
émis par le service d'authentification et signé avec `JWT_SECRET`.

- `sub` : UUID de l'utilisateur
- `role` : `ADMIN` (médecin) ou `PATIENT`

Le médecin (ADMIN) peut tout faire. Le patient (PATIENT) peut seulement consulter
ses propres téléconsultations (`patient_id` = `sub`).

## Lancer les tests

Depuis ce dossier :

    python -m venv .venv
    .venv\Scripts\Activate.ps1      # Linux/Mac : source .venv/bin/activate
    pip install -r requirements-dev.txt
    python -m pytest -v

Résultat attendu : 11 passed. Aucune base PostgreSQL ni Docker n'est nécessaire
(SQLite en mémoire).
