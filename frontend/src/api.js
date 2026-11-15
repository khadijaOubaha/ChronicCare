const BASE = "/api/v1/teleconsultations";

function messageFrom(data, status) {
  const detail = data && data.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) return detail.map((d) => d.msg).join(" ; ");
  if (status === 401) return "Session expirée, reconnectez-vous.";
  if (status === 403) return "Action non autorisée pour votre rôle.";
  return `Erreur ${status}`;
}

async function call(url, { method = "GET", body, token } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Service injoignable. Vérifiez que le Teleconsultations Service tourne (port 8005).");
  }
  if (response.status === 204) return null;
  let data = null;
  try {
    data = await response.json();
  } catch {
    /* corps vide ou non JSON */
  }
  if (!response.ok) {
    const error = new Error(messageFrom(data, response.status));
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  list: (token, params = {}) => {
    const query = new URLSearchParams({ limit: "100", ...params }).toString();
    return call(`${BASE}?${query}`, { token });
  },
  get: (token, id) => call(`${BASE}/${id}`, { token }),
  create: (token, body) => call(BASE, { method: "POST", body, token }),
  request: (token, body) => call(`${BASE}/requests`, { method: "POST", body, token }),
  update: (token, id, body) => call(`${BASE}/${id}`, { method: "PUT", body, token }),
  confirm: (token, id, body) => call(`${BASE}/${id}/confirm`, { method: "PATCH", body, token }),
  setStatus: (token, id, status) => call(`${BASE}/${id}/status`, { method: "PATCH", body: { status }, token }),
  remove: (token, id) => call(`${BASE}/${id}`, { method: "DELETE", token }),
  // Patients Service (liste utilisée par le médecin pour choisir un patient)
  patients: async (token) => {
    const data = await call("/api/v1/patients?limit=100", { token });
    return Array.isArray(data) ? data : [];
  },
};

export async function fakeLogin(email, role) {
  let response;
  try {
    response = await fetch("/dev/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
  } catch {
    throw new Error("Connexion impossible.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "Connexion impossible.");
  return data.token;
}
