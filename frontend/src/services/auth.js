
const API_URL =
  import.meta.env.VITE_AUTH_API_URL || "http://localhost:8000";

// Inscription d'un patient
export async function registerUser(userData) {
  return apiRequest("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// Connexion et récupération du JWT
export async function loginUser(credentials) {
  return apiRequest("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

// Récupération du profil de l'utilisateur connecté
export async function getMyProfile(token) {
  return apiRequest("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof data.detail === "string"
        ? data.detail
        : "Une erreur est survenue.";

    throw new Error(message);
  }

  return data;
}
