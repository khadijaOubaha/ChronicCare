import { NavLink } from 'react-router-dom';
import {
  Activity,
  LayoutDashboard,
  Pill,
  Video,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/traitement', label: 'Traitement', icon: Pill, end: true },
  { to: '/patient/mesures', label: 'Mesures', icon: Activity },
  { to: '/teleconsultations', label: 'Téléconsultations', icon: Video, end: true },
];

export default function AppLayout({ user, crumbs = [], children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">
            <Activity size={20} />
          </span>
          ChronicCare
        </div>

        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'nav-item' + (isActive ? ' active' : '')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span
                key={i}
                className={i === crumbs.length - 1 ? 'current' : ''}
              >
                {i > 0 && ' / '}
                {c}
              </span>
            ))}
          </div>

          <input
            className="search"
            placeholder="Rechercher..."
            aria-label="Rechercher"
          />

          {user && (
            <div className="profile">
              <div className="avatar solid">{user.initials}</div>
              <div>
                <strong>{user.name}</strong>
                <span>{user.role}</span>
              </div>
            </div>
          )}
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}