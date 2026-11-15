import { ClipboardList, FileText, LayoutDashboard, LogOut, Users, Video } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import Logo from "./ui/Logo";

const TELE = { to: "/teleconsultations", label: "Téléconsultations", icon: Video };
const DASH = { label: "Tableau de bord", icon: LayoutDashboard };

// Les entrées sans `to` appartiennent à d'autres services : affichées, mais inactives.
const NAV = {
  PATIENT: [DASH, { label: "Suivi santé", icon: ClipboardList }, TELE],
  ADMIN: [DASH, { label: "Patients", icon: Users }, { label: "Prescriptions", icon: FileText }, TELE],
};

const base = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

export default function Layout() {
  const { user, signOut } = useAuth();
  const items = NAV[user.role] ?? [DASH, TELE];
  const roleLabel = user.role === "ADMIN" ? "Médecin" : "Patient";

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden flex-col bg-brand-900 p-5 text-white lg:flex">
        <div className="mb-8 text-white"><Logo /></div>
        <nav aria-label="Navigation principale" className="space-y-1">
          {items.map(({ to, label, icon: Icon }) =>
            to ? (
              <NavLink
                key={label}
                to={to}
                className={({ isActive }) =>
                  `${base} ${isActive ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"}`
                }
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </NavLink>
            ) : (
              <span key={label} title="Module géré par un autre service" aria-disabled="true" className={`${base} cursor-not-allowed text-slate-500`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </span>
            ),
          )}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div className="lg:hidden"><Logo dark /></div>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Se déconnecter"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <nav aria-label="Navigation mobile" className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          <NavLink to="/teleconsultations" className="whitespace-nowrap rounded-md bg-brand-900 px-3 py-1.5 text-sm font-medium text-white">
            Téléconsultations
          </NavLink>
        </nav>

        <main className="mx-auto max-w-6xl p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
