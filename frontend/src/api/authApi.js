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

  // 200 -> UserRead (mise à jour du profil : full_name, email, phone, date_of_birth, address, disease)
  updateProfile: (data) => http.patch(`${BASE}/me`, data).then((r) => r.data),

  // 200 -> { message } | 400 mot de passe identique | 401 mot de passe actuel invalide
  changePassword: ({ current_password, new_password }) =>
    http.post(`${BASE}/change-password`, { current_password, new_password }).then((r) => r.data),

  // 200 -> { message, email }
  forgotPassword: ({ email }) =>
    http.post(`${BASE}/forgot-password`, { email }).then((r) => r.data),

  // 200 -> { message }
  resetPassword: ({ token, new_password }) =>
    http.post(`${BASE}/reset-password`, { token, new_password }).then((r) => r.data),

  // 200 -> { active_session, session_expires_in_minutes, role, last_login_estimate, encryption_standard }
  securityInfo: () => http.get(`${BASE}/security`).then((r) => r.data),
};
