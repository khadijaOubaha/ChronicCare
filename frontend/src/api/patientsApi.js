import { http } from "./http";

const BASE = "/api/v1/patients";

// Le service Patients renvoie un tableau simple (pas de total) et n'exige pas de jeton.
export const patientsApi = {
  list: ({ offset = 0, limit = 20 } = {}) =>
    http.get(BASE, { params: { offset, limit } }).then((r) => r.data),
  get: (id) => http.get(`${BASE}/${id}`).then((r) => r.data),
  create: (payload) => http.post(BASE, payload).then((r) => r.data),
  update: (id, changes) => http.patch(`${BASE}/${id}`, changes).then((r) => r.data),
  remove: (id) => http.delete(`${BASE}/${id}`), // 204
};
