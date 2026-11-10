import { FileText } from "lucide-react";
import { useState } from "react";
import { treatmentsApi } from "../api/treatmentsApi";
import Card from "../components/ui/Card";
import ComingSoon from "../components/ui/ComingSoon";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import Tabs from "../components/ui/Tabs";
import TreatmentCard from "../features/treatments/TreatmentCard";
import { useAsync } from "../hooks/useAsync";
import { expiringIn } from "../utils/format";

export default function SuiviPage() {
  const { data, loading, error, reload } = useAsync(() => treatmentsApi.mine());
  const [tab, setTab] = useState("active");
  const all = data ?? [];
  const active = all.filter((t) => t.status === "ACTIVE");
  const history = all.filter((t) => t.status !== "ACTIVE");
  const shown = tab === "active" ? active : history;
  const expiring = active.filter((t) => expiringIn(t) !== null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi du patient"
        description="Consultez les traitements prescrits par votre médecin."
        actions={
          !loading && !error && (
            <Tabs
              value={tab}
              onChange={setTab}
              tabs={[
                { id: "active", label: `En cours (${active.length})` },
                { id: "history", label: `Historique (${history.length})` },
              ]}
            />
          )
        }
      />

      {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          {shown.length === 0 ? (
            <EmptyState title={tab === "active" ? "Aucun traitement en cours" : "Aucun traitement dans l'historique"}>
              Les traitements prescrits par votre médecin apparaîtront ici.
            </EmptyState>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {shown.map((t) => <TreatmentCard key={t.id} treatment={t} />)}
            </div>
          )}

          {tab === "active" && expiring.length > 0 && (
            <Card className="flex items-center gap-4 bg-slate-100">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-slate-500">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold text-brand-900">Besoin d'un renouvellement ?</h2>
                <p className="text-sm text-slate-600">
                  {expiring.map((t) => {
                    const d = expiringIn(t);
                    return `${t.medication_name} : ${d < 0 ? "ordonnance échue" : `fin dans ${d} jour${d > 1 ? "s" : ""}`}`;
                  }).join(" · ")}
                  . Contactez votre médecin pour la renouveler.
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      <ComingSoon items={["prises du jour et adhérence", "mesures vitales", "rappels", "export PDF"]} />
    </div>
  );
}
