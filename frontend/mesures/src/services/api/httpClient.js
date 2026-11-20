import axios from 'axios';
import { MESURES_API_URL } from '../../config/env';

// Un seul client : le service Mesures. (Pas de token tant que Auth n'est pas intégré.)
export const mesuresHttp = axios.create({
  baseURL: MESURES_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});
