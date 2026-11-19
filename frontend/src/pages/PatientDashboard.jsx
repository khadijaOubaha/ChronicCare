import { Activity, ArrowRight, Calendar, CheckCircle2, Heart, Pill, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { treatmentsApi } from "../api/treatmentsApi";
import { useAuth } from "../auth/AuthContext";
import Badge from "../components/ui/Badge";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import TreatmentCard from "../features/treatments/TreatmentCard";
import { useAsync } from "../hooks/useAsync";
import { expiringIn, formatDate } from "../utils/format";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => treatmentsApi.mine());
  const treatments = data ?? [];
  const active = treatments.filter((t) => t.status === "ACTIVE");
  const expiring = active.filter((t) => expiringIn(t) !== null);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-900 p-6 text-white shadow-md">
        <h1 className="text-2xl font-bold">Bonjour, {user.full_name}</h1>
        <p className="mt-2 text-sm text-slate-200">
          {loading || error
            ? "Retrouvez ici le suivi personnalisé de vos traitements et de vos constantes."
            : active.length
              ? `Vous avez ${active.length} traitement${active.length > 1 ? "s" : ""} en cours.`
              : "Aucun traitement actif pour le moment."}
          {expiring.length > 0 && ` ${expiring.length} arrive${expiring.length > 1 ? "nt" : ""} bientôt à échéance.`}
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            to="/suivi"
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Accéder à mon suivi santé <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Cartes d'indicateurs rapides pour le patient */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Traitements en cours"
          value={active.length}
          icon={Pill}
        />
        <StatCard
          label="Pathologie suivie"
          value={user?.disease ? (user.disease === "TYPE_2_DIABETES" ? "Diabète T2" : "Hypertension") : "Non spécifiée"}
          icon={Activity}
        />
        <StatCard
          label="Compte vérifié"
          value="Actif"
          icon={Shield}
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-brand-900">Mes traitements en cours</h2>
          <Link to="/suivi" className="text-sm font-semibold text-brand-600 hover:underline">
            Voir le planning complet →
          </Link>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : active.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">
            Votre médecin n'a pas encore prescrit de traitement médical.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {active.slice(0, 4).map((t) => (
              <TreatmentCard key={t.id} treatment={t} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
