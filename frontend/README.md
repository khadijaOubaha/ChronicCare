# ChronicCare — Frontend

## Démarrage
```bash
npm install
npm run dev        # http://localhost:5173
```
Services requis : Auth (8000), Patients (8001), Treatments (8002). Le proxy de `vite.config.js`
route `/api/v1/*` vers le bon service (`AUTH_URL`, `PATIENTS_URL`, `TREATMENTS_URL`).

## Pages
- Patient : tableau de bord `/`, suivi des traitements `/suivi`
- Médecin : tableau de bord `/`, patients `/patients`, prescriptions `/prescriptions`
- Commun : téléconsultations `/teleconsultations` (page « bientôt disponible », pas de backend)

## Structure
- `src/api/` client HTTP unique + un module par service
- `src/auth/` session, jeton, routes protégées, rôles
- `src/features/` formulaires et cartes métier (patients, traitements)
- `src/components/ui/` composants réutilisables · `src/layouts/` · `src/pages/` · `src/hooks/` · `src/utils/`
