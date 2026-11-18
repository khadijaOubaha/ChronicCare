import { Activity, CalendarClock, Plus, Search, UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import { useAuth } from "../auth/AuthContext";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import { useAsync } from "../hooks/useAsync";
import { expiringIn, formatDate, fullName } from "../utils/format";

const LIMIT = 10;

export default function DoctorDashboard() {
  const { user } = useAuth();
  const patients = useAsync(() => patientsApi.list({ limit: LIMIT }));
  const treatments = useAsync(() => treatmentsApi.mine()); // ADMIN : tous les traitements

  const loading = patients.loading || treatments.loading;
  const error = patients.error || treatments.error;

  const pList = patients.data?.items ?? (Array.isArray(patients.data) ? patients.data : []);
  const totalPatients = patients.data?.total ?? pList.length;

  const tList = treatments.data ?? [];
  const activeT = tList.filter((t) => t.status === "ACTIVE");

  const btn = "inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-900 p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold">Bonjour, Dr. {user.full_name}</h1>
        <p className="mt-2 text-sm text-slate-200">
          Suivi de votre patientèle, prescriptions en cours et alertes médicales.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/prescriptions/nouveau"
            className={`${btn} bg-brand-500 text-white hover:bg-brand-600`}
          >
            <Plus className="h-4 w-4" /> Nouvelle prescription
          </Link>
          <Link
            to="/patients/nouveau"
            className={`${btn} border border-white/30 text-white hover:bg-white/10`}
          >
            <UserPlus className="h-4 w-4" /> Nouveau patient
          </Link>
          <Link
            to="/patients"
            className={`${btn} border border-white/30 text-white hover:bg-white/10`}
          >
            <Search className="h-4 w-4" /> Rechercher un dossier
          </Link>
        </div>
      </section>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            patients.reload();
            treatments.reload();
          }}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total patients" value={totalPatients} icon={Users} />
            <StatCard
              label="Patients actifs"
              value={pList.filter((p) => p.is_active).length}
              icon={Users}
            />
            <StatCard
              label="Traitements en cours"
              value={activeT.length}
              icon={Activity}
            />
            <StatCard
              label="Fins sous 7 jours"
              value={activeT.filter((t) => expiringIn(t) !== null).length}
              icon={CalendarClock}
            />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-900">Patients récemment suivis</h2>
              <Link to="/patients" className="text-sm font-semibold text-brand-600 hover:underline">
                Voir tous les patients →
              </Link>
            </div>
            {pList.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun patient enregistré.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">Patient</th>
                      <th className="py-2.5 px-4 font-semibold">E-mail</th>
                      <th className="py-2.5 px-4 font-semibold">Créé le</th>
                      <th className="py-2.5 px-4 font-semibold">Statut</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pList.slice(0, 5).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-medium text-slate-800">
                          <Link to={`/patients/${p.id}`} className="hover:text-brand-600">
                            {fullName(p)}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{p.email ?? "—"}</td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(p.created_at)}</td>
                        <td className="py-3 px-4">
                          <Badge variant={p.is_active ? "success" : "neutral"}>
                            {p.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/patients/${p.id}`}
                            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                          >
                            Dossier →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
