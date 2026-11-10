import { http } from "./http";

const BASE = "/api/v1/auth";

export const authApi = {
  // 201 -> { id, full_name, email, role, is_active, created_at } | 409 email déjà utilisé
  register: ({ full_name, email, password }) =>
    http.post(`${BASE}/register`, { full_name, email, password }).then((r) => r.data),

  // 200 -> { access_token, token_type } (JSON, pas de form-data) | 401 | 403 compte désactivé
  login: ({ email, password }) =>
    http
      .post(`${BASE}/login`, { email, password }, { skipAuthRedirect: true })
      .then((r) => r.data),

  // 200 -> UserRead | 401
  me: () => http.get(`${BASE}/me`).then((r) => r.data),
};
