import { useState } from 'react';
import { useMesures } from '../../context/MesuresContext';
import { getHistorique } from '../../services/mesuresService';
import useFetch from '../../hooks/useFetch';
import { Spinner, ErrorMessage, EmptyState } from '../../components/common/ui';
import Pagination from '../../components/measures/Pagination';
import { formatDay, formatMesure } from '../../utils/formatters';

const PERIODS = [[7, '7 derniers jours'], [30, '30 derniers jours'], [90, '90 derniers jours'], [365, '365 derniers jours']];
const PAGE_SIZE = 10;

export default function HistoryPage() {
  const { patientId, types, version } = useMesures();
  const [typeId, setTypeId] = useState('');
  const [jours, setJours] = useState(30);
  const [page, setPage] = useState(1);
  // Le tri est fait par le backend (jamais côté client : faux avec la pagination).
  const { data, loading, error } = useFetch(
    () => getHistorique(patientId, { type_mesure_id: typeId, jours, page, page_size: PAGE_SIZE }),
    [patientId, typeId, jours, page, version]
  );

  return (
    <>
      <div className="page-head">
        <h1 className="page-title">Historique des mesures</h1>
        <div className="filters">
          <select className="pill-select" value={typeId} onChange={(e) => { setTypeId(e.target.value); setPage(1); }}>
            <option value="">Tous les types</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
          </select>
          <select className="pill-select" value={jours} onChange={(e) => { setJours(Number(e.target.value)); setPage(1); }}>
            {PERIODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      {error ? <ErrorMessage error={error} /> : loading && !data ? <Spinner /> : !data?.items.length ? <EmptyState>Aucune mesure sur cette période.</EmptyState> : (
        <>
          <div className="table-wrap"><table>
            <thead><tr><th>Date</th><th>Type</th><th>Valeur</th><th>Unité</th></tr></thead>
            <tbody>{data.items.map((m) => (
              <tr key={m.id}><td>{formatDay(m.jour_mesure)}</td><td>{m.type_nom}</td><td><strong>{formatMesure(m.valeur, m.valeur_secondaire)}</strong></td><td className="muted">{m.unite}</td></tr>
            ))}</tbody>
          </table></div>
          <Pagination page={data.page} totalPages={data.total_pages} total={data.total} onChange={setPage} />
        </>
      )}
    </>
  );
}
