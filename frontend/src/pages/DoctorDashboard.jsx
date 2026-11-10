import { Activity, CalendarClock, Plus, Search, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import { useAuth } from "../auth/AuthContext";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import ComingSoon from "../components/ui/ComingSoon";
import StatCard from "../components/ui/StatCard";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import { useAsync } from "../hooks/useAsync";
import { expiringIn, formatDate, fullName } from "../utils/format";

const LIMIT = 100;

export default function DoctorDashboard() {
  const { user } = useAuth();
  const patients = useAsync(() => patientsApi.list({ limit: LIMIT }));
  const treatments = useAsync(() => treatmentsApi.mine()); // ADMIN : tous les traitements

  const loading = patients.loading || treatments.loading;
  const error = patients.error || treatments.error;
  const pList = patients.data ?? [];
  const tList = treatments.data ?? [];
  const activeT = tList.filter((t) => t.status === "ACTIVE");
  const total = `${pList.length}${pList.length === LIMIT ? "+" : ""}`;

  const btn = "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold";
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-900 p-6 text-white">
        <h1 className="text-2xl font-bold">Bonjour, Dr. {user.full_name}</h1>
        <p className="mt-2 text-sm text-slate-200">Gérez vos patients et leurs prescriptions.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/prescriptions?new=1" className={`${btn} bg-brand-500 text-white hover:bg-brand-600`}>
            Nouvelle prescription <Plus className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/patients" className={`${btn} border border-white/30 text-white hover:bg-white/10`}>
            Rechercher un dossier <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {loading ? <LoadingState /> : error ? (
        <ErrorState error={error} onRetry={() => { patients.reload(); treatments.reload(); }} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total patients" value={total} icon={Users} />
            <StatCard label="Patients actifs" value={pList.filter((p) => p.is_active).length} icon={Users} />
            <StatCard label="Traitements en cours" value={activeT.length} icon={Activity} />
            <StatCard label="Fins sous 7 jours" value={activeT.filter((t) => expiringIn(t) !== null).length} icon={CalendarClock} />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-900">Patients récents</h2>
              <Link to="/patients" className="text-sm font-semibold text-brand-900 hover:underline">Voir tout</Link>
            </div>
            {pList.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun patient enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr><th className="py-2 font-medium">Patient</th><th className="font-medium">E-mail</th><th className="font-medium">Créé le</th><th className="font-medium">Statut</th></tr>
                  </thead>
                  <tbody>
                    {pList.slice(0, 5).map((p) => (
                      <tr key={p.id} className="border-t border-slate-100">
                        <td className="py-3 font-medium text-slate-800">{fullName(p)}</td>
                        <td className="text-slate-600">{p.email ?? "—"}</td>
                        <td className="text-slate-600">{formatDate(p.created_at)}</td>
                        <td><Badge tone={p.is_active ? "green" : "slate"}>{p.is_active ? "Actif" : "Inactif"}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      <ComingSoon items={["croissance de la patientèle", "alertes critiques", "planning du jour", "tâches administratives"]} />
    </div>
  );
}
