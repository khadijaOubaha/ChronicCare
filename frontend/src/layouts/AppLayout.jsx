import { ClipboardList, FileText, LayoutDashboard, LogOut, Users, Video } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
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

export default function AppLayout() {
  const { user, logout } = useAuth();
  const items = NAV[user.role] ?? [DASH];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col bg-brand-900 p-5 text-white lg:flex">
        <div className="mb-8 text-white"><Logo /></div>
        <nav aria-label="Navigation principale" className="space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="lg:hidden"><Logo dark /></div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800">{user.full_name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              aria-label="Se déconnecter"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav aria-label="Navigation mobile" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {items.map(({ to, label, end }) => (
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
