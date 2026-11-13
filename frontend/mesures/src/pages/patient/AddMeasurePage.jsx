import { useState } from 'react';
import { useMesures } from '../../context/MesuresContext';
import { createMesure } from '../../services/mesuresService';
import { formatDay, parseDecimal } from '../../utils/formatters';

const inRange = (v, min, max) => (min === null || min === undefined || v >= Number(min)) && (max === null || max === undefined || v <= Number(max));

export default function AddMeasurePage() {
  const { patientId, types, resume, refresh } = useMesures();
  const firstTodo = resume.cartes.find((c) => c.statut === 'a_renseigner')?.type_mesure.id;
  const [typeId, setTypeId] = useState(firstTodo || types[0]?.id || '');
  const [v1, setV1] = useState('');
  const [v2, setV2] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }

  const type = types.find((t) => t.id === typeId);
  const alreadyDone = resume.cartes.some((c) => c.type_mesure.id === typeId && c.statut === 'enregistree');

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    const a = parseDecimal(v1);
    const b = type.deux_valeurs ? parseDecimal(v2) : null;
    if (a === null || (type.deux_valeurs && b === null)) return setMsg({ ok: false, text: 'Saisissez une valeur numérique valide.' });
    if (!inRange(a, type.valeur_min, type.valeur_max)) return setMsg({ ok: false, text: `${type.libelle_valeur || 'Valeur'} : entre ${type.valeur_min} et ${type.valeur_max}.` });
    if (type.deux_valeurs && !inRange(b, type.valeur_secondaire_min, type.valeur_secondaire_max))
      return setMsg({ ok: false, text: `${type.libelle_valeur_secondaire || 'Valeur 2'} : entre ${type.valeur_secondaire_min} et ${type.valeur_secondaire_max}.` });
    setBusy(true);
    try {
      await createMesure(patientId, { type_mesure_id: typeId, valeur: a, ...(type.deux_valeurs ? { valeur_secondaire: b } : {}) });
      setV1(''); setV2('');
      setMsg({ ok: true, text: 'Mesure enregistrée avec succès.' });
      await refresh();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
      if (err.status === 409) refresh().catch(() => {});
    } finally { setBusy(false); }
  }

  if (!type) return <div className="state">Aucun type de mesure disponible.</div>;
  return (
    <>
      <h1 className="page-title">Enregistrer une mesure</h1>
      <div className="two-col">
        <form className="card form" onSubmit={submit}>
          <label>Type de mesure
            <select value={typeId} onChange={(e) => { setTypeId(e.target.value); setV1(''); setV2(''); setMsg(null); }}>
              {types.map((t) => <option key={t.id} value={t.id}>{t.nom} ({t.unite})</option>)}
            </select>
          </label>
          <label>{type.libelle_valeur || 'Valeur'}
            <input inputMode="decimal" value={v1} onChange={(e) => setV1(e.target.value)} placeholder={`${type.valeur_min} – ${type.valeur_max}`} />
          </label>
          {type.deux_valeurs && (
            <label>{type.libelle_valeur_secondaire || 'Valeur 2'}
              <input inputMode="decimal" value={v2} onChange={(e) => setV2(e.target.value)} placeholder={`${type.valeur_secondaire_min} – ${type.valeur_secondaire_max}`} />
            </label>
          )}
          <label>Date
            <input value={`${formatDay(resume.date_du_jour)} (${resume.fuseau_horaire})`} readOnly />
          </label>
          {alreadyDone && <p className="msg info">Une mesure de ce type est déjà enregistrée aujourd’hui.</p>}
          {msg && <p className={`msg ${msg.ok ? 'success' : 'fail'}`}>{msg.text}</p>}
          <div><button className="btn primary-dark" disabled={busy || alreadyDone}>{busy ? 'Enregistrement…' : 'Enregistrer la mesure'}</button></div>
          <p className="muted">Un seul type par enregistrement.</p>
        </form>

        <aside className="card">
          <h3>Mesures du jour</h3>
          <ul className="summary">
            {resume.cartes.map(({ type_mesure: t, statut }) => (
              <li key={t.id}><span>{t.nom}</span><span className={statut === 'enregistree' ? 'status ok' : 'status todo'}>{statut === 'enregistree' ? 'Enregistrée' : 'À renseigner'}</span></li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
