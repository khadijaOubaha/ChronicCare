
import { http } from "./http";

const BASE = "/api/v1/patients";

const mesuresUrl = (patientId) =>
  `${BASE}/${patientId}/mesures`;

export const mesuresApi = {
  // GET : profil du patient et mesure principale
  getProfil: (patientId) =>
    http.get(`${mesuresUrl(patientId)}/profil`).then((r) => r.data),

  // GET : types de mesures autorisés pour sa maladie
  getTypes: (patientId) =>
    http.get(`${mesuresUrl(patientId)}/types`).then((r) => r.data),

  // GET : résumé des mesures du jour
  getToday: (patientId) =>
    http.get(`${mesuresUrl(patientId)}/aujourdhui`).then((r) => r.data),

  // POST : enregistrer une seule mesure
  create: (patientId, payload) =>
    http.post(mesuresUrl(patientId), payload).then((r) => r.data),

  // GET : historique paginé
  getHistory: (patientId, params = {}) =>
    http
      .get(`${mesuresUrl(patientId)}/historique`, { params })
      .then((r) => r.data),

  // GET : courbe d'évolution
  getChart: (patientId, params = {}) =>
    http
      .get(`${mesuresUrl(patientId)}/courbe`, { params })
      .then((r) => r.data),
};
