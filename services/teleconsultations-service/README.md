# Teleconsultations Service

Service FastAPI de gestion des téléconsultations (ChronicCare). Port : 8005.

## Authentification

Toutes les routes sauf `/health` exigent un jeton JWT (`Authorization: Bearer ...`)
émis par le service d'authentification et signé avec `JWT_SECRET`.

- `sub` : UUID de l'utilisateur
- `role` : `ADMIN` (médecin) ou `PATIENT`

Le médecin (ADMIN) peut tout faire. Le patient (PATIENT) peut consulter ses propres
téléconsultations (`patient_id` = `sub`) et **envoyer une demande** (voir ci-dessous) ;
il ne peut pas créer, modifier, terminer ni supprimer une téléconsultation (403).

## Statuts et demande du patient

    REQUESTED --(médecin : /confirm)--> SCHEDULED --> COMPLETED
        |                                   |
        +--(médecin : refus)--> CANCELLED <-+

| Route | Rôle | Effet |
|---|---|---|
| `POST /api/v1/teleconsultations/requests` | PATIENT | Crée une demande : `patient_id` imposé par le jeton, statut `REQUESTED`, aucun créneau bloqué. Corps : `doctor_id`, `notes` (motif), `scheduled_at` (souhaitée, facultative). |
| `PATCH /{id}/confirm` | ADMIN | `REQUESTED -> SCHEDULED` : date future obligatoire, créneau libre, lien facultatif. |
| `PATCH /{id}/status` avec `CANCELLED` | ADMIN | Refuse la demande. `SCHEDULED` est refusé ici (409) : passer par `/confirm`. |

Une demande ne bloque aucun créneau ; seules les consultations `SCHEDULED` et
`COMPLETED` comptent pour le contrôle des doublons.

## Base existante

`create_all` ne modifie pas une table déjà créée. Pour une base existante, exécuter
une fois `migrations/001_add_requested_status.sql`.

## Lancer les tests

Depuis ce dossier :

    python -m venv .venv
    .venv\Scripts\Activate.ps1      # Linux/Mac : source .venv/bin/activate
    pip install -r requirements-dev.txt
    python -m pytest -v

Résultat attendu : 21 passed. Aucune base PostgreSQL ni Docker n'est nécessaire
(SQLite en mémoire).
