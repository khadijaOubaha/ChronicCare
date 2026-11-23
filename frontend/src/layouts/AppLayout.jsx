
import {
  Activity,
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Users,
  Video,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS, ROLES } from "../auth/roles";
import Logo from "../components/ui/Logo";

import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { remindersApi } from "../api/remindersApi";



const DASH = {
  to: "/",
  label: "Tableau de bord",
  icon: LayoutDashboard,
  end: true,
};

const TELE = {
  to: "/teleconsultations",
  label: "Téléconsultations",
  icon: Video,
};

const NAV = {
  [ROLES.PATIENT]: [
    DASH,
    {
      to: "/suivi",
      label: "Suivi santé",
      icon: ClipboardList,
    },
    {
      to: "/mesures",
      label: "Mes mesures",
      icon: Activity,
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
    },
    TELE,
  ],

  [ROLES.DOCTOR]: [
    DASH,
    {
      to: "/patients",
      label: "Patients",
      icon: Users,
    },
    {
      to: "/mesures-patients",
      label: "Mesures",
      icon: Activity,
    },
    {
      to: "/prescriptions",
      label: "Prescriptions",
      icon: FileText,
    },
    {
      to: "/notifications",
      label: "Notifications",
      icon: Bell,
    },
    TELE,
  ],
};

const ACCOUNT_NAV = [
  {
    to: "/profil",
    label: "Mon profil",
    icon: User,
  },
  {
    to: "/securite",
    label: "Sécurité",
    icon: ShieldCheck,
  },
];

function NavigationLink({ item, unreadCount = 0 }) {
  const { to, label, icon: Icon, end } = item;

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `nav-link${isActive ? " active" : ""}`
      }
    >
      <Icon size={18} aria-hidden="true" />

      <span>{label}</span>

      {to === "/notifications" && unreadCount > 0 && (
        <span
          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-bold text-white"
          aria-label={`${unreadCount} notifications non lues`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </NavLink>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const loadUnreadCount = async () => {
      if (user?.role !== ROLES.PATIENT && user?.role !== ROLES.DOCTOR) {
      setUnreadCount(0);
      return;
      }

      try {
        const data = await remindersApi.list({
          limit: 1,
          offset: 0,
          unreadOnly: true,
        });

        if (active) {
          setUnreadCount(data?.total ?? 0);
        }
      } catch (error) {
        console.error("Erreur de chargement du compteur :", error);
      }
    };

    loadUnreadCount();

    return () => {
      active = false;
    };
  }, [user?.role, location.pathname]); 
  const items = NAV[user?.role] ?? [DASH];

  const initials = (user?.full_name || "U")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const roleLabel = ROLE_LABELS[user?.role] ?? user?.role;

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <Logo />
          </div>

          <p className="nav-heading">MENU PRINCIPAL</p>

          <nav
            className="sidebar-nav"
            aria-label="Navigation principale"
          >
            {items.map((item) => (
              <NavigationLink key={item.to} item={item} />
            ))}
          </nav>
        </div>

        <div className="sidebar-bottom">
          <p className="nav-heading">MON COMPTE</p>

          <nav
            className="sidebar-nav"
            aria-label="Navigation compte"
          >
            {ACCOUNT_NAV.map((item) => (
              <NavigationLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="sidebar-user">
            <Link to="/profil" className="profile">
              <div className="avatar">{initials}</div>

              <div className="profile-info">
                <strong>{user?.full_name}</strong>
                <span>{roleLabel}</span>
              </div>
            </Link>

            <button
              type="button"
              className="logout-btn"
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="main">
        <header className="topbar">
          <div className="mobile-logo">
            <Logo dark />
          </div>

          <div className="topbar-right">
            <Link to="/profil" className="profile">
              <div className="avatar">{initials}</div>

              <div className="profile-info">
                <strong>{user?.full_name}</strong>
                <span>{roleLabel}</span>
              </div>
            </Link>

            <button
              type="button"
              className="logout-btn mobile-logout"
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Navigation mobile */}
        <nav
          className="mobile-nav"
          aria-label="Navigation mobile"
        >
          {[...items, ...ACCOUNT_NAV].map((item) => (
            <NavigationLink key={item.to} item={item} />
          ))}
        </nav>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
