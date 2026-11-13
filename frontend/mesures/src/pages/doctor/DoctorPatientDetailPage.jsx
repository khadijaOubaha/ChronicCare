import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch';
import { getDoctorPatient } from '../../services/doctorService';
import { Avatar, DemoBanner, EmptyState, Spinner } from '../../components/common/ui';
import EvolutionChart from '../../components/measures/EvolutionChart';
import { DISEASES, formatDay, formatDayShort, formatMesure, initials } from '../../utils/formatters';
import { DEMO_TODAY } from '../../data/doctorDemoData';

export default function DoctorPatientDetailPage() {
  const { patientId } = useParams();
  const { setLast } = useOutletContext();
  const { data: p, loading } = useFetch(() => getDoctorPatient(patientId), [patientId]);
  const [tab, setTab] = useState('date');
  const [jours, setJours] = useState(30);
  const [date, setDate] = useState(DEMO_TODAY);

  useEffect(() => { if (p) setLast(`${p.firstName} ${p.lastName}`); return () => setLast(null); }, [p, setLast]);

  if (loading) return <Spinner />;
  if (!p) return <EmptyState>Patient introuvable (données de démonstration).</EmptyState>;

  const pr = p.principal;
  const chart = p.courbe.slice(-jours).map((x) => ({ label: formatDayShort(x.jour), v1: x.valeur, v2: x.valeurSecondaire ?? undefined }));
  const dayList = p.mesures.filter((m) => m.jour === date).sort((a, b) => a.heure.localeCompare(b.heure));
  const lastDay = p.courbe[p.courbe.length - 1].jour;

  return (
    <>
      <DemoBanner />
      <div className="page-head">
        <div className="who">
          <Avatar large text={initials(p.firstName, p.lastName)} />
          <div><h1 className="page-title">{p.firstName} {p.lastName}</h1><p className="muted">{DISEASES[p.disease]} · Consultation en lecture seule</p></div>
        </div>
        <Link className="btn" to="/medecin/patients">← Retour à mes patients</Link>
      </div>

      <div className="two-col doctor-detail">
        <section className="card">
          <div className="card-head">
            <h3>Évolution de la {pr.nom.toLowerCase()} ({pr.unite})</h3>
            <select className="pill-select plain" value={jours} onChange={(e) => setJours(Number(e.target.value))}>
              {[7, 30, 90].map((d) => <option key={d} value={d}>{d} jours</option>)}
            </select>
          </div>
          <EvolutionChart data={chart} deux={pr.deuxValeurs} name1={pr.libelle} name2={pr.libelleSecondaire} unit={pr.unite} />
        </section>

        <section className="card">
          <div className="seg">
            <button className={tab === 'date' ? 'on' : ''} onClick={() => setTab('date')}>Par date</button>
            <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>Tout l’historique</button>
          </div>
          {tab === 'date' ? (
            <>
              <label className="form-label">Rechercher par date
                <input type="date" value={date} max={DEMO_TODAY} onChange={(e) => setDate(e.target.value || DEMO_TODAY)} />
              </label>
              <p className="status ok">Dernière mesure : {formatDay(lastDay)}</p>
              <h4>Mesures du {formatDay(date)}</h4>
              {!dayList.length ? <EmptyState>Aucune mesure ce jour</EmptyState> : (
                <ul className="summary day">{dayList.map((m, i) => (
                  <li key={i}><span>{m.type}</span><strong>{formatMesure(m.valeur, m.valeurSecondaire)} {m.unite}</strong><span className="muted">{m.heure}</span></li>
                ))}</ul>
              )}
            </>
          ) : (
            <div className="table-wrap inner"><table>
              <thead><tr><th>Date</th><th>Type</th><th>Valeur</th><th>Unité</th><th>Heure</th></tr></thead>
              <tbody>{p.mesures.map((m, i) => (
                <tr key={i}><td>{formatDay(m.jour)}</td><td>{m.type}</td><td><strong>{formatMesure(m.valeur, m.valeurSecondaire)}</strong></td><td className="muted">{m.unite}</td><td className="muted">{m.heure}</td></tr>
              ))}</tbody>
            </table></div>
          )}
          <p className="muted note">Consultation en lecture seule : les mesures ne peuvent pas être modifiées.</p>
        </section>
      </div>
    </>
  );
}
