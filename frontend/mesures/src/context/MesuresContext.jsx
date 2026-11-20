import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { DEV_PATIENT_ID } from '../config/env';
import { getProfil, getTypes, getResumeJour } from '../services/mesuresService';

const Ctx = createContext(null);
export const useMesures = () => useContext(Ctx);

// Charge profil + types + résumé du jour UNE fois, partagés par les 4 onglets.
export function MesuresProvider({ children }) {
  const [s, setS] = useState({ profil: null, types: [], resume: null, loading: true, error: null });
  const [version, setVersion] = useState(0); // incrémenté après un POST : force le rechargement historique/courbe

  const load = useCallback(async () => {
    if (!DEV_PATIENT_ID) {
      setS((x) => ({ ...x, loading: false, error: { message: 'VITE_DEV_PATIENT_ID est vide dans le fichier .env.' } }));
      return;
    }
    setS((x) => ({ ...x, loading: true, error: null }));
    try {
      const [profil, types, resume] = await Promise.all([
        getProfil(DEV_PATIENT_ID), getTypes(DEV_PATIENT_ID), getResumeJour(DEV_PATIENT_ID),
      ]);
      setS({ profil, types, resume, loading: false, error: null });
    } catch (e) {
      setS((x) => ({ ...x, loading: false, error: e }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = useCallback(async () => {
    const resume = await getResumeJour(DEV_PATIENT_ID);
    setS((x) => ({ ...x, resume }));
    setVersion((v) => v + 1);
  }, []);

  return <Ctx.Provider value={{ ...s, patientId: DEV_PATIENT_ID, version, refresh, reload: load }}>{children}</Ctx.Provider>;
}
