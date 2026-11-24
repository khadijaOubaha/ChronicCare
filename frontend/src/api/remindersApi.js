

import { http } from "./http";

const BASE = "/api/v1/notifications";

export const remindersApi = {
  list: ({
    patientId,
    limit = 20,
    offset = 0,
    unreadOnly = false,
  } = {}) => {
    const params = {
      limit,
      offset,
      unread_only: unreadOnly,
    };

    // Le patient connecté n'a pas besoin d'envoyer son patient_id.
    // Pour un médecin (ADMIN), le patient_id est obligatoire.
    if (patientId) {
      params.patient_id = patientId;
    }

    return http.get(BASE, { params }).then((response) => response.data);
  },

  markAsRead: (notificationId) =>
    http
      .patch(`${BASE}/${notificationId}/read`)
      .then((response) => response.data),

  get: (notificationId) =>
    http
      .get(`${BASE}/${notificationId}`)
      .then((response) => response.data),
};
