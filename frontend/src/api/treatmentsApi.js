import { http } from "./http";

const BASE = "/api/v1";

export const treatmentsApi = {
  // PATIENT : ses traitements. ADMIN : les traitements de tous les patients.
  mine: () => http.get(`${BASE}/treatments/me`).then((r) => r.data),
  get: (id) => http.get(`${BASE}/treatments/${id}`).then((r) => r.data),
  // ADMIN uniquement. 409 si le patient est inactif.
  forPatient: (patientId) =>
    http.get(`${BASE}/patients/${patientId}/treatments`).then((r) => r.data),
  create: (payload) => http.post(`${BASE}/treatments`, payload).then((r) => r.data),
  update: (id, changes) => http.patch(`${BASE}/treatments/${id}`, changes).then((r) => r.data),
  stop: (id) => http.patch(`${BASE}/treatments/${id}/stop`).then((r) => r.data),
};
