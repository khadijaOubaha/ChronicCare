import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);
const KEY = "chroniccare.token";

function decode(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(atob(part))));
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    const role = String(payload.role || "").toUpperCase();
    return { id: payload.sub, role, name: payload.name || (role === "ADMIN" ? "Médecin" : "Patient") };
  } catch {
    return null;
  }
}

function readStored() {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = readStored();
    return stored && decode(stored) ? stored : null;
  });

  const signIn = useCallback((newToken) => {
    try {
      sessionStorage.setItem(KEY, newToken);
    } catch {
      /* stockage indisponible : la session vivra en mémoire */
    }
    setToken(newToken);
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignoré */
    }
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ token, user: token ? decode(token) : null, signIn, signOut }),
    [token, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
