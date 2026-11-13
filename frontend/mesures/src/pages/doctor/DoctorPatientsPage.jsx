import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import useFetch from '../../hooks/useFetch';
import { getDoctorPatients } from '../../services/doctorService';
import { Avatar, DemoBanner, EmptyState, Spinner } from '../../components/common/ui';
import { DISEASES, formatDayShort, formatMesure, initials } from '../../utils/formatters';

const Sparkline = ({ points }) => (
  <div className="spark"><ResponsiveContainer width="100%" height={36}>
    <LineChart data={points}><YAxis hide domain={['dataMin - 3', 'dataMax + 3']} /><Line type="linear" dataKey="valeur" stroke="#0e4a5c" strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart>
  </ResponsiveContainer></div>
);

export default function DoctorPatientsPage() {
  const { data, loading } = useFetch(getDoctorPatients, []);
  const [q, setQ] = useState('');
  const [disease, setDisease] = useState('');
  const list = (data || []).filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(q.trim().toLowerCase()) && (!disease || p.disease === disease));

  return (
    <>
      <DemoBanner />
      <div className="page-head">
        <div>
          <h1 className="page-title">Suivi des mesures de mes patients</h1>
          <p className="muted">Données de démonstration · {list.length} patient{list.length > 1 ? 's' : ''}</p>
        </div>
        <div className="filters">
          <input className="pill-input" placeholder="Rechercher un patient (nom)..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="pill-select" value={disease} onChange={(e) => setDisease(e.target.value)}>
            <option value="">Toutes les maladies</option>
            {Object.entries(DISEASES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      {loading ? <Spinner /> : !list.length ? <EmptyState>Aucun patient trouvé</EmptyState> : (
        <div className="table-wrap"><table>
          <thead><tr><th>Patient</th><th>Maladie</th><th>Dernière mesure principale</th><th>Évolution</th><th /></tr></thead>
          <tbody>{list.map((p) => {
            const last = p.courbe[p.courbe.length - 1];
            return (
              <tr key={p.id}>
                <td><div className="who"><Avatar text={initials(p.firstName, p.lastName)} /><strong>{p.firstName} {p.lastName}</strong></div></td>
                <td><span className="pill">{DISEASES[p.disease]}</span></td>
                <td><span className="muted">{p.principal.nom}</span><br /><strong>{formatMesure(last.valeur, last.valeurSecondaire)} {p.principal.unite}</strong> <span className="muted">· {formatDayShort(last.jour)}</span></td>
                <td><Sparkline points={p.courbe.slice(-7)} /></td>
                <td><Link className="btn" to={`/medecin/patients/${p.id}`}>Voir le détail</Link></td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
    </>
  );
}
