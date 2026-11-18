import { http } from "./http";

const BASE = "/api/v1/patients";

export const patientsApi = {
  // GET /api/v1/patients -> { items, total, offset, limit }
  list: (params = {}) => {
    const { offset = 0, limit = 20, search, status, disease } = params;
    const query = { offset, limit };
    if (search) query.search = search;
    if (status) query.status = status;
    if (disease) query.disease = disease;
    return http.get(BASE, { params: query }).then((r) => r.data);
  },

  // GET /api/v1/patients/me -> patient profile of the connected user
  me: () => http.get(`${BASE}/me`).then((r) => r.data),

  // GET /api/v1/patients/:id -> PatientRead
  get: (id) => http.get(`${BASE}/${id}`).then((r) => r.data),

  // POST /api/v1/patients -> 201 PatientRead (ADMIN)
  create: (payload) => http.post(BASE, payload).then((r) => r.data),

  // PATCH /api/v1/patients/:id -> 200 PatientRead (ADMIN)
  update: (id, changes) => http.patch(`${BASE}/${id}`, changes).then((r) => r.data),

  // DELETE /api/v1/patients/:id -> 204 (ADMIN)
  remove: (id) => http.delete(`${BASE}/${id}`),
};
