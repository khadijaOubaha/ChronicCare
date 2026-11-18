import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  User,
  Users,
  Video,
} from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS, ROLES } from "../auth/roles";
import Logo from "../components/ui/Logo";

const DASH = { to: "/", label: "Tableau de bord", icon: LayoutDashboard, end: true };
const TELE = { to: "/teleconsultations", label: "Téléconsultations", icon: Video };

const NAV = {
  [ROLES.PATIENT]: [DASH, { to: "/suivi", label: "Suivi santé", icon: ClipboardList }, TELE],
  [ROLES.DOCTOR]: [
    DASH,
    { to: "/patients", label: "Patients", icon: Users },
    { to: "/prescriptions", label: "Prescriptions", icon: FileText },
    TELE,
  ],
};

const ACCOUNT_NAV = [
  { to: "/profil", label: "Mon profil", icon: User },
  { to: "/securite", label: "Sécurité", icon: ShieldCheck },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV[user?.role] ?? [DASH];

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Sidebar Desktop */}
      <aside className="hidden flex-col justify-between bg-brand-900 p-5 text-white lg:flex">
        <div>
          <div className="mb-8 text-white">
            <Logo />
          </div>
          <nav aria-label="Navigation principale" className="space-y-1">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div>
          <div className="border-t border-white/10 pt-4">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mon compte
            </p>
            <nav aria-label="Navigation compte" className="mt-2 space-y-1">
              {ACCOUNT_NAV.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4 flex items-center justify-between">
            <Link to="/profil" className="flex items-center gap-2.5 hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="text-left text-xs leading-tight">
                <p className="font-semibold text-white truncate max-w-[120px]">{user?.full_name}</p>
                <p className="text-slate-400">{ROLE_LABELS[user?.role] ?? user?.role}</p>
              </div>
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="lg:hidden">
            <Logo dark />
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Link
              to="/profil"
              className="flex items-center gap-2.5 text-right leading-tight hover:opacity-80"
            >
              <div>
                <p className="text-sm font-semibold text-slate-800">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] ?? user?.role}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white">
                {initials}
              </div>
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Se déconnecter"
              title="Se déconnecter"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile Nav */}
        <nav
          aria-label="Navigation mobile"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
        >
          {[...items, ...ACCOUNT_NAV].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                  isActive ? "bg-brand-900 text-white" : "text-slate-600"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="mx-auto max-w-6xl p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
