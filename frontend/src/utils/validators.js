const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Les limites reprennent celles des schémas Pydantic du service Auth.
export const validateEmail = (v) => {
  if (!v.trim()) return "L'adresse e-mail est obligatoire.";
  return EMAIL_RE.test(v.trim()) ? "" : "Saisissez une adresse e-mail valide.";
};

export const validateFullName = (v) => {
  const n = v.trim();
  if (n.length < 2) return "Le nom doit contenir au moins 2 caractères.";
  return n.length > 150 ? "Le nom ne peut pas dépasser 150 caractères." : "";
};

export const validateNewPassword = (v) => {
  if (v.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  return v.length > 128 ? "Le mot de passe ne peut pas dépasser 128 caractères." : "";
};
