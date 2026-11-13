const MESSAGES = {
  400: "Ce type de mesure n'est pas autorisé pour ce patient.",
  403: "Ce patient est inactif : l'enregistrement n'est pas possible.",
  404: 'Patient introuvable.',
  409: "Une mesure de ce type a déjà été enregistrée aujourd'hui.",
  502: 'Réponse invalide du service Patients. Réessayez plus tard.',
  503: 'Le service Patients est indisponible. Réessayez plus tard.',
};

// Transforme toute erreur Axios en { status, message } lisible.
export function toApiError(err) {
  if (!err.response) {
    return { status: 0, message: "Impossible de joindre le service Mesures. Vérifiez qu'il est démarré." };
  }
  const { status, data } = err.response;
  if (status === 422) {
    const d = data?.detail;
    const txt = Array.isArray(d) ? d.map((x) => x.msg).join(' ; ') : typeof d === 'string' ? d : '';
    return { status, message: 'Données invalides' + (txt ? ` : ${txt}` : '.') };
  }
  return { status, message: MESSAGES[status] || `Une erreur est survenue (${status}).` };
}
