const TZ = 'Africa/Casablanca';
export const DISEASES = { diabetes_type_2: 'Diabète de type 2', hypertension: 'Hypertension' };

// Si le backend renvoie une date sans fuseau, on la considère UTC (à vérifier, voir DOCUMENTATION.md).
const hasTz = (s) => /(Z|[+-]\d{2}:?\d{2})$/.test(s);
const toDate = (s) => new Date(hasTz(s) ? s : s + 'Z');

export const formatTime = (iso) =>
  iso ? new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(toDate(iso)) : '';

export const formatDay = (iso) => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
export const formatDayShort = (iso) => { const [, m, d] = iso.slice(0, 10).split('-'); return `${d}/${m}`; };
export const formatLongDate = (iso) => {
  const t = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full', timeZone: 'UTC' }).format(new Date(iso.slice(0, 10) + 'T12:00:00Z'));
  return t.charAt(0).toUpperCase() + t.slice(1);
};
export const formatNumber = (v) =>
  v === null || v === undefined || v === '' ? '' : new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Number(v));
export const formatMesure = (v, v2) => (v2 === null || v2 === undefined ? formatNumber(v) : `${formatNumber(v)}/${formatNumber(v2)}`);
// "36,8" ou "36.8" -> 36.8 ; vide/invalide -> null
export const parseDecimal = (s) => {
  const t = String(s).trim().replace(',', '.');
  const n = Number(t);
  return t === '' || Number.isNaN(n) ? null : n;
};
export const initials = (first, last) => `${(first || '?')[0]}${(last || '')[0] || ''}`.toUpperCase();
