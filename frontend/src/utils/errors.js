// Erreur déjà formulée pour l'utilisateur (ex. mauvais onglet de rôle).
export class AppError extends Error {}

// FastAPI renvoie { detail: "texte" } ou, pour un 422, { detail: [{ loc, msg, type }] }.
export function getErrorMessage(error) {
  if (error instanceof AppError) return error.message;
  if (!error?.response) {
    return error?.code === "ECONNABORTED"
      ? "Le serveur met trop de temps à répondre. Réessayez dans un instant."
      : "Impossible de joindre le serveur. Vérifiez votre connexion.";
  }
  const { status, data } = error.response;
  if (typeof data?.detail === "string") return data.detail;
  if (status === 422) return "Certains champs sont invalides. Vérifiez le formulaire.";
  if (status >= 500) return "Le service est momentanément indisponible. Réessayez plus tard.";
  return "Une erreur est survenue. Réessayez.";
}

// 422 -> { champ: "message" } pour afficher les erreurs sous chaque champ.
export function getFieldErrors(error) {
  const detail = error?.response?.data?.detail;
  if (!Array.isArray(detail)) return {};
  return detail.reduce((acc, item) => {
    const field = item.loc?.[item.loc.length - 1];
    if (typeof field === "string" && !acc[field]) acc[field] = item.msg;
    return acc;
  }, {});
}
