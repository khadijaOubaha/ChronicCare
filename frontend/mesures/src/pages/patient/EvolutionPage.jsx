import { useState } from 'react';
import { useMesures } from '../../context/MesuresContext';
import { getCourbe } from '../../services/mesuresService';
import useFetch from '../../hooks/useFetch';
import { Spinner, ErrorMessage, EmptyState } from '../../components/common/ui';
import EvolutionChart from '../../components/measures/EvolutionChart';
import { DISEASES, formatDayShort } from '../../utils/formatters';

export default function EvolutionPage() {
  const { patientId, profil, version } = useMesures();
  const [jours, setJours] = useState(30);
  // Sans type_mesure_id, le backend renvoie la mesure principale.
  const { data, loading, error } = useFetch(() => getCourbe(patientId, { jours }), [patientId, jours, version]);
  const t = data?.type_mesure;
  const disease = (DISEASES[profil.patient.disease_type] || '').toLowerCase();

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{t ? `Évolution de la ${t.nom.toLowerCase()}` : 'Évolution'}</h1>
          {t && <p className="muted">Mesure principale · {disease} ({t.unite})</p>}
        </div>
        <select className="pill-select" value={jours} onChange={(e) => setJours(Number(e.target.value))}>
          {[7, 30, 90].map((d) => <option key={d} value={d}>{d} jours</option>)}
        </select>
      </div>
      <div className="card chart-card">
        {error ? <ErrorMessage error={error} /> : loading && !data ? <Spinner /> : data.vide || !data.points.length ? <EmptyState>Aucune mesure sur cette période.</EmptyState> : (
          <EvolutionChart
            data={data.points.map((p) => ({ label: formatDayShort(p.jour), v1: Number(p.valeur), v2: p.valeur_secondaire == null ? undefined : Number(p.valeur_secondaire) }))}
            deux={t.deux_valeurs} name1={t.libelle_valeur || t.nom} name2={t.libelle_valeur_secondaire || 'Valeur 2'} unit={t.unite}
          />
        )}
      </div>
    </>
  );
}
