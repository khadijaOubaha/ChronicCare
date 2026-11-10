import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Les 3 services n'ont pas tous le CORS activé (seul Auth autorise localhost:5173).
// En développement, tout passe donc par ce proxy : le navigateur ne parle qu'à Vite.
const AUTH = process.env.AUTH_URL || "http://localhost:8000";
const PATIENTS = process.env.PATIENTS_URL || "http://localhost:8001";
const TREATMENTS = process.env.TREATMENTS_URL || "http://localhost:8002";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api/v1/auth": { target: AUTH, changeOrigin: true },
      // GET /api/v1/patients/{id}/treatments appartient au service Treatments :
      // cette règle doit rester AVANT la règle générale /api/v1/patients.
      "^/api/v1/patients/[^/]+/treatments": { target: TREATMENTS, changeOrigin: true },
      "/api/v1/patients": { target: PATIENTS, changeOrigin: true },
      "/api/v1/treatments": { target: TREATMENTS, changeOrigin: true },
    },
  },
});
