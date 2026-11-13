
import { Link } from 'react-router-dom';
import { useMesures } from '../../context/MesuresContext';
import {
  DISEASES,
  formatLongDate,
  formatMesure,
  formatTime,
} from '../../utils/formatters';

export default function TodayPage() {
  const { profil, resume } = useMesures();

  const {
    restantes = [],
    enregistrees,
    total,
    cartes,
    date_du_jour,
  } = resume;

  // Le backend renvoie une liste des mesures restantes.
  const nombreRestantes = Array.isArray(restantes)
    ? restantes.length
    : 0;

  // Message dynamique selon le nombre de mesures manquantes.
  const msg =
    nombreRestantes === 0
      ? 'Bravo ! Toutes vos mesures du jour sont renseignées.'
      : nombreRestantes === 1
        ? 'Il vous reste 1 mesure à renseigner aujourd’hui.'
        : `Il vous reste ${nombreRestantes} mesures à renseigner aujourd’hui.`;

  return (
    <>
      <section className="hero">
        <div>
          <h1>Bonjour, {profil.patient.first_name}</h1>

          <p>
            {msg} {formatLongDate(date_du_jour)}.
          </p>

          {nombreRestantes > 0 && (
            <Link
              to="/patient/mesures/saisir"
              className="btn primary"
            >
              Saisir une mesure +
            </Link>
          )}
        </div>

        <div className="progress">
          <span>Progression du jour</span>
          <strong>
            {enregistrees} / {total}
          </strong>
        </div>
      </section>

      <section className="cards">
        {cartes.map(({ type_mesure: t, statut, mesure }) => {
          const done = statut === 'enregistree' && mesure;

          return (
            <article className="card measure-card" key={t.id}>
              <span className="muted">{t.nom}</span>

              <strong className="big">
                {done
                  ? formatMesure(mesure.valeur, mesure.valeur_secondaire)
                  : '—'}{' '}
                {t.unite}
              </strong>

              <span className={done ? 'status ok' : 'status todo'}>
                {done
                  ? `Enregistrée à ${formatTime(mesure.date_mesure)}`
                  : 'À renseigner'}
              </span>
            </article>
          );
        })}
      </section>

      <section className="card disease">
        <div>
          <h3>
            {DISEASES[profil.patient.disease_type] ||
              profil.patient.disease_type}
          </h3>

          <p className="muted">
            Une seule mesure par type et par jour. Une mesure enregistrée
            ne peut plus être modifiée.
          </p>
        </div>

        <Link to="/patient/mesures/historique" className="btn">
          Voir l’historique
        </Link>
      </section>
    </>
  );
}
