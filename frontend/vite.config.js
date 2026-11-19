
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const AUTH = process.env.AUTH_URL || "http://localhost:8000";
const PATIENTS = process.env.PATIENTS_URL || "http://localhost:8001";
const TREATMENTS = process.env.TREATMENTS_URL || "http://localhost:8002";
const MESURES = process.env.MESURES_URL || "http://localhost:8003";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    proxy: {
      "/api/v1/auth": {
        target: AUTH,
        changeOrigin: true,
      },

      // Mesures doit être déclaré avant le proxy général Patients.
      "^/api/v1/patients/[^/]+/mesures": {
        target: MESURES,
        changeOrigin: true,
      },

      // Treatments doit également rester avant Patients.
      "^/api/v1/patients/[^/]+/treatments": {
        target: TREATMENTS,
        changeOrigin: true,
      },

      "/api/v1/patients": {
        target: PATIENTS,
        changeOrigin: true,
      },

      "/api/v1/treatments": {
        target: TREATMENTS,
        changeOrigin: true,
      },
    },
  },
});
