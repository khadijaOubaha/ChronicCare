import { NavLink, Outlet } from 'react-router-dom';
import AppLayout from './AppLayout';
import { Spinner, ErrorMessage } from '../common/ui';
import { useMesures } from '../../context/MesuresContext';
import { initials } from '../../utils/formatters';

const TABS = [
  { to: '/patient/mesures', label: 'Mesures du jour', end: true },
  { to: '/patient/mesures/saisir', label: 'Saisir une mesure' },
  { to: '/patient/mesures/historique', label: 'Historique' },
  { to: '/patient/mesures/evolution', label: 'Évolution' },
];

export default function PatientLayout() {
  const { loading, error, profil, reload } = useMesures();
  const p = profil?.patient;
  const user = p && { name: `${p.first_name} ${p.last_name}`, role: 'Patient', initials: initials(p.first_name, p.last_name) };
  return (
    <AppLayout user={user} crumbs={['Tableau de bord', 'Mesures']}>
      {loading && !profil ? <Spinner /> : error && !profil ? <ErrorMessage error={error} onRetry={reload} /> : (
        <>
          <nav className="tabs">
            {TABS.map((t) => <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>{t.label}</NavLink>)}
          </nav>
          <Outlet />
        </>
      )}
    </AppLayout>
  );
}
