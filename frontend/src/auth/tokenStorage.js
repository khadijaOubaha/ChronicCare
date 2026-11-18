const KEY = "cc_token";

const safe = (fn) => {
  try {
    return fn();
  } catch {
    return null;
  }
};

// « Se souvenir de moi » : localStorage ; sinon sessionStorage (perdu à la fermeture de l'onglet).
export const tokenStorage = {
  get: () => safe(() => sessionStorage.getItem(KEY) || localStorage.getItem(KEY)),
  set(token, remember = false) {
    this.clear();
    safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, token));
  },
  clear: () =>
    safe(() => {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
    }),
};
