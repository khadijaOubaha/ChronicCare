export const DISEASE_LABELS = { TYPE_2_DIABETES: "Diabète de type 2", HYPERTENSION: "Hypertension" };
export const STATUS_LABELS = { ACTIVE: "En cours", COMPLETED: "Terminé", STOPPED: "Arrêté" };
export const SEX_LABELS = { F: "Femme", M: "Homme", OTHER: "Autre" };

const toDate = (iso) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export const formatDate = (iso) => (iso ? dateFmt.format(toDate(iso)) : "—");

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const ageFrom = (iso) => {
  if (!iso) return null;
  const b = toDate(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age -= 1;
  return age;
};

// Jours restants avant une date (négatif si dépassée).
export const daysUntil = (iso) => {
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((toDate(iso) - today) / 86400000);
};

// Traitement actif dont la fin est dans les 7 jours (ou déjà dépassée).
export const expiringIn = (t) =>
  t.status === "ACTIVE" && t.end_date && daysUntil(t.end_date) <= 7 ? daysUntil(t.end_date) : null;

export const fullName = (p) => (p ? `${p.first_name} ${p.last_name}` : "Patient inconnu");
