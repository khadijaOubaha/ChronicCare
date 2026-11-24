import { http } from "./http";

const BASE = "/api/v1/teleconsultations";

// Teleconsultations Service (port 8005). Le jeton JWT est ajouté par l'intercepteur de ./http.
export const teleconsultationsApi = {
  // PATIENT : seulement ses téléconsultations. ADMIN (médecin) : filtres libres.
  // params : { skip, limit, patient_id, doctor_id, status, date_from, date_to }
  list: (params = {}) =>
    http.get(BASE, { params: { limit: 100, ...params } }).then((r) => r.data),
  get: (id) => http.get(`${BASE}/${id}`).then((r) => r.data),

  // Liste des médecins actifs : [{ id, full_name }]
  doctors: () =>
    http.get(`${BASE}/doctors`).then((r) => (Array.isArray(r.data) ? r.data : [])),

  // PATIENT : { doctor_id, scheduled_at?, notes? } -> statut REQUESTED
  request: (payload) => http.post(`${BASE}/requests`, payload).then((r) => r.data),

  // ADMIN : { patient_id, doctor_id (= médecin connecté), scheduled_at, meeting_link?, notes? } -> SCHEDULED
  create: (payload) => http.post(BASE, payload).then((r) => r.data),
  // ADMIN : { patient_id?, doctor_id?, scheduled_at?, meeting_link?, notes? }
  update: (id, changes) => http.put(`${BASE}/${id}`, changes).then((r) => r.data),
  // ADMIN : REQUESTED -> SCHEDULED, { scheduled_at, meeting_link?, notes? }
  confirm: (id, payload) => http.patch(`${BASE}/${id}/confirm`, payload).then((r) => r.data),
  // ADMIN : "COMPLETED" | "CANCELLED" (SCHEDULED passe par confirm)
  setStatus: (id, status) => http.patch(`${BASE}/${id}/status`, { status }).then((r) => r.data),
  remove: (id) => http.delete(`${BASE}/${id}`).then(() => null),
};
