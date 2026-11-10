import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UNAUTHORIZED_EVENT } from "../api/http";
import { authApi } from "../api/authApi";
import { AppError } from "../utils/errors";
import { ROLE_LABELS } from "./roles";
import { tokenStorage } from "./tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  // Restaure la session au chargement de la page.
  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  // Jeton expiré détecté par l'intercepteur HTTP.
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired);
  }, []);

  // expectedRole : rôle choisi sur l'onglet Patient/Médecin. Le backend ne reçoit pas
  // ce choix : on le compare au rôle réel renvoyé par /me.
  const login = useCallback(async ({ email, password, remember, expectedRole }) => {
    const { access_token } = await authApi.login({ email, password });
    tokenStorage.set(access_token, remember);
    try {
      const me = await authApi.me();
      if (expectedRole && me.role !== expectedRole) {
        throw new AppError(
          `Ce compte n'est pas un compte ${ROLE_LABELS[expectedRole].toLowerCase()}. ` +
            `Choisissez l'onglet « ${ROLE_LABELS[me.role]} ».`
        );
      }
      setUser(me);
      return me;
    } catch (error) {
      tokenStorage.clear();
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>.");
  return ctx;
};
