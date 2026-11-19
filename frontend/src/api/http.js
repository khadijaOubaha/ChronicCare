import axios from "axios";
import { tokenStorage } from "../auth/tokenStorage";

export const UNAUTHORIZED_EVENT = "cc:unauthorized";

// Client HTTP unique. Les chemins /api/v1/... sont résolus vers le bon
// microservice par le proxy Vite (dev) ou par le reverse proxy (production).
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

http.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Le jeton expire après 30 min (sans refresh) : sur un 401 on ferme la session.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const expired =
      error.response?.status === 401 &&
      tokenStorage.get() &&
      !error.config?.skipAuthRedirect;
    if (expired) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);
