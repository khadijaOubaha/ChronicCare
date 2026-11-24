
import {
  Activity,
  ClipboardPlus,
  History,
  TrendingUp,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { MesuresProvider } from "../../context/MesuresContext";

const TABS = [
  {
    to: "/mesures",
    label: "Aujourd'hui",
    icon: Activity,
    end: true,
  },
  {
    to: "/mesures/saisir",
    label: "Saisir une mesure",
    icon: ClipboardPlus,
  },
  {
    to: "/mesures/historique",
    label: "Historique",
    icon: History,
  },
  {
    to: "/mesures/evolution",
    label: "Évolution",
    icon: TrendingUp,
  },
];

export default function MesuresLayout() {
  return (
    <MesuresProvider>
      <div className="min-w-0 space-y-6">
        {/* Navigation */}
        <nav
          className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          aria-label="Navigation des mesures"
        >
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-teal-700 text-white shadow-sm"
                    : "text-slate-600 hover:bg-teal-50 hover:text-teal-800",
                ].join(" ")
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Contenu de la page */}
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </MesuresProvider>
  );
}
