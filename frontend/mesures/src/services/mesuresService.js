import { mesuresHttp as http } from './api/httpClient';
import { toApiError } from './api/apiError';

const base = (id) => `/api/v1/patients/${id}/mesures`;
const clean = (p) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''));
async function call(promise) {
  try { return (await promise).data; } catch (e) { throw toApiError(e); }
}

export const getProfil = (id) => call(http.get(`${base(id)}/profil`));
export const getTypes = (id) => call(http.get(`${base(id)}/types`));
export const getResumeJour = (id) => call(http.get(`${base(id)}/aujourdhui`));
// body : { type_mesure_id, valeur, valeur_secondaire? } — rien d'autre.
export const createMesure = (id, body) => call(http.post(base(id), body));
// params : { type_mesure_id?, jours? | date_debut?/date_fin?, page, page_size }
export const getHistorique = (id, params) => call(http.get(`${base(id)}/historique`, { params: clean(params) }));
// params : { type_mesure_id?, jours }
export const getCourbe = (id, params) => call(http.get(`${base(id)}/courbe`, { params: clean(params) }));
