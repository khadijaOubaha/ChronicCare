
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../auth/roles";
import { patientsApi } from "../api/patientsApi";
import { mesuresApi } from "../api/mesuresApi";

const MesuresContext = createContext(null);

export function MesuresProvider({ children }) {
  const { user, loading: authLoading } = useAuth();

  const [patient, setPatient] = useState(null);
  const [profil, setProfil] = useState(null);
  const [types, setTypes] = useState([]);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    const currentPatient = await patientsApi.me();
    setPatient(currentPatient);

    const patientId = currentPatient.id;

    const [profilData, typesData, resumeData] = await Promise.all([
      mesuresApi.getProfil(patientId),
      mesuresApi.getTypes(patientId),
      mesuresApi.getToday(patientId),
    ]);

    setProfil(profilData);
    setTypes(typesData);
    setResume(resumeData);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!user || user.role !== ROLES.PATIENT) {
      setLoading(false);
      return;
    }

    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const currentPatient = await patientsApi.me();

        const [profilData, typesData, resumeData] = await Promise.all([
          mesuresApi.getProfil(currentPatient.id),
          mesuresApi.getTypes(currentPatient.id),
          mesuresApi.getToday(currentPatient.id),
        ]);

        if (!active) return;

        setPatient(currentPatient);
        setProfil(profilData);
        setTypes(typesData);
        setResume(resumeData);
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const refreshData = useCallback(async () => {
    setError(null);

    try {
      await refresh();
    } catch (err) {
      setError(err);
      throw err;
    }
  }, [refresh]);

  const value = {
    patient,
    patientId: patient?.id,
    profil,
    types,
    resume,
    loading,
    error,
    refresh: refreshData,
  };

  return (
    <MesuresContext.Provider value={value}>
      {children}
    </MesuresContext.Provider>
  );
}

export function useMesures() {
  const context = useContext(MesuresContext);

  if (!context) {
    throw new Error(
      "useMesures doit être utilisé dans MesuresProvider."
    );
  }

  return context;
}
