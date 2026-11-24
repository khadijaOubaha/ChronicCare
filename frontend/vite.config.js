
import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { DOCTORS } from "./src/data/doctors.js";

const here = dirname(fileURLToPath(import.meta.url));

const AUTH = process.env.AUTH_URL || "http://localhost:8000";
const PATIENTS = process.env.PATIENTS_URL || "http://localhost:8001";
const TREATMENTS = process.env.TREATMENTS_URL || "http://localhost:8002";
const MESURES = process.env.MESURES_URL || "http://localhost:8003";
const REMINDERS = process.env.REMINDERS_URL || "http://localhost:8004";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Lit JWT_SECRET depuis l'environnement, sinon depuis ../.env. */
function readSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const envFile = resolve(here, "../.env");

  if (existsSync(envFile)) {
    const line = readFileSync(envFile, "utf8")
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith("JWT_SECRET="));

    if (line) return line.split("=").slice(1).join("=").trim();
  }

  return "";
}

const b64 = (value) =>
  Buffer.from(
    typeof value === "string" ? value : JSON.stringify(value)
  ).toString("base64url");

function signJwt(payload, secret) {
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64(payload);

  const sig = createHmac("sha256", secret)
    .update(`${head}.${body}`)
    .digest("base64url");

  return `${head}.${body}.${sig}`;
}

/** UUID stable (déterministe) à partir d'un texte, pour les comptes de test. */
function uuidFrom(text) {
  const h = createHmac("sha256", "chroniccare-dev")
    .update(text)
    .digest("hex");

  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * Connexion de TEST (mode fakeauth uniquement).
 * Ne jamais utiliser en production.
 */
function fakeAuth() {
  return {
    name: "chroniccare-fake-auth",

    configureServer(server) {
      server.middlewares.use("/dev/login", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          return res.end();
        }

        let raw = "";

        req.on("data", (chunk) => (raw += chunk));

        req.on("end", () => {
          const send = (status, data) => {
            res.statusCode = status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(data));
          };

          const secret = readSecret();

          if (!secret) {
            return send(500, {
              detail:
                "JWT_SECRET est vide : définissez-le dans .env ou dans l'environnement.",
            });
          }

          let input;

          try {
            input = JSON.parse(raw || "{}");
          } catch {
            return send(400, { detail: "Requête invalide" });
          }

          const email = String(input.email || "").trim().toLowerCase();
          const role = input.role === "ADMIN" ? "ADMIN" : "PATIENT";

          if (!email.includes("@")) {
            return send(400, { detail: "E-mail invalide" });
          }

          const local = email.split("@")[0];

          let sub;
          let name;

          if (role === "ADMIN") {
            const doctor =
              DOCTORS.find((d) => d.key === local) || DOCTORS[0];

            sub = doctor.id;
            name = doctor.name;
          } else {
            sub = UUID_RE.test(local) ? local : uuidFrom(email);

            name = UUID_RE.test(local)
              ? "Luc Durand"
              : local.charAt(0).toUpperCase() + local.slice(1);
          }

          const now = Math.floor(Date.now() / 1000);

          const token = signJwt(
            {
              sub,
              role,
              name,
              iat: now,
              exp: now + 8 * 3600,
            },
            secret
          );

          send(200, { token });
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "fakeauth" ? [fakeAuth()] : [])],

  server: {
    host: "0.0.0.0",
    port: 3000,

    proxy: {
      "/api/v1/auth": {
        target: AUTH,
        changeOrigin: true,
      },

      // Mesures avant le proxy général Patients.
      "^/api/v1/patients/[^/]+/mesures": {
        target: MESURES,
        changeOrigin: true,
      },

      // Traitements avant le proxy général Patients.
      "^/api/v1/patients/[^/]+/treatments": {
        target: TREATMENTS,
        changeOrigin: true,
      },
      //remienders 
      "/api/v1/notifications": {
        target: REMINDERS,
        changeOrigin: true,

      },
      "/api/v1/events": {
        target: REMINDERS,
        changeOrigin: true,
}, 
      // Téléconsultations : communication entre conteneurs Docker.
      "/api/v1/teleconsultations": {
        target: "http://teleconsultations-service:8005",
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
}));
