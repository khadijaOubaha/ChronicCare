import { Link } from "react-router-dom";
import { treatmentsApi } from "../api/treatmentsApi";
import { useAuth } from "../auth/AuthContext";
import Card from "../components/ui/Card";
import ComingSoon from "../components/ui/ComingSoon";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import TreatmentCard from "../features/treatments/TreatmentCard";
import { useAsync } from "../hooks/useAsync";
import { expiringIn } from "../utils/format";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => treatmentsApi.mine());
  const active = (data ?? []).filter((t) => t.status === "ACTIVE");
  const expiring = active.filter((t) => expiringIn(t) !== null);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-900 p-6 text-white">
        <h1 className="text-2xl font-bold">Bonjour, {user.full_name}</h1>
        <p className="mt-2 text-sm text-slate-200">
          {loading || error
            ? "Retrouvez ici le suivi de vos traitements."
            : active.length
              ? `Vous avez ${active.length} traitement${active.length > 1 ? "s" : ""} en cours.`
              : "Aucun traitement en cours pour le moment."}
          {expiring.length > 0 && ` ${expiring.length} arrive${expiring.length > 1 ? "nt" : ""} bientôt à échéance.`}
        </p>
        <Link to="/suivi" className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600">
          Voir mon suivi
        </Link>
      </section>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-brand-900">Mes traitements en cours</h2>
        {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : active.length === 0 ? (
          <p className="text-sm text-slate-500">Votre médecin n'a pas encore prescrit de traitement.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {active.slice(0, 4).map((t) => <TreatmentCard key={t.id} treatment={t} />)}
          </div>
        )}
      </Card>

      <ComingSoon items={["constantes vitales", "évolution de la santé", "tâches du jour", "téléconsultations"]} />
    </div>
  );
}
