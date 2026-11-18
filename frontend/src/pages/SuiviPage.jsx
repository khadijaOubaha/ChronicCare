import {
  Activity,
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Pill,
  Sun,
  Sunset,
  Moon,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { treatmentsApi } from "../api/treatmentsApi";
import { useAsync } from "../hooks/useAsync";
import { formatDate } from "../utils/formatters";

export default function SuiviPage() {
  const { data, loading, error, reload } = useAsync(() => treatmentsApi.mine());
  const [takenMap, setTakenMap] = useState({});

  const treatments = data ?? [];
  const activeTreatments = treatments.filter((t) => t.status === "ACTIVE");

  const toggleTaken = (key) => {
    setTakenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Répartition par moment de la journée basée sur la fréquence
  const morningTreatments = activeTreatments.filter((t) => {
    const f = (t.frequency || "").toLowerCase();
    return f.includes("matin") || f.includes("2 fois") || f.includes("3 fois") || f.includes("jour");
  });

  const noonTreatments = activeTreatments.filter((t) => {
    const f = (t.frequency || "").toLowerCase();
    return f.includes("midi") || f.includes("3 fois") || f.includes("repas");
  });

  const eveningTreatments = activeTreatments.filter((t) => {
    const f = (t.frequency || "").toLowerCase();
    return f.includes("soir") || f.includes("2 fois") || f.includes("3 fois") || f.includes("coucher");
  });

  // Calcul du score d'observance du jour
  const totalSlots = morningTreatments.length + noonTreatments.length + eveningTreatments.length;
  const takenCount = Object.values(takenMap).filter(Boolean).length;
  const adherenceScore = totalSlots > 0 ? Math.round((takenCount / totalSlots) * 100) : 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon suivi de santé"
        description="Consultez votre plan de prise journalier, vos traitements et votre niveau d'adhésion."
      />

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : (
        <>
          {/* 4 Cartes KPI */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Traitements en cours
                </span>
                <Pill className="h-5 w-5 text-brand-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {activeTreatments.length}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Prescriptions actives
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Prises validées aujourd'hui
                </span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {takenCount} / {totalSlots}
              </p>
              <span className="mt-1 inline-block text-xs text-emerald-600">
                {takenCount === totalSlots && totalSlots > 0
                  ? "Toutes les prises effectuées !"
                  : "À compléter"}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Dernière constante
                </span>
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">125 / 80</p>
              <span className="mt-1 inline-block text-xs text-slate-500">
                Tension artérielle normale (mmHg)
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">
                  Observance du jour
                </span>
                <TrendingUp className="h-5 w-5 text-sky-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">{adherenceScore}%</p>
              <span className="mt-1 inline-block text-xs text-sky-600">
                {adherenceScore >= 80 ? "Excellente adhésion" : "Rappels recommandés"}
              </span>
            </div>
          </div>

          {/* Kanban journalier des prises (Fig 15) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">
                Planning journalier des médicaments
              </h2>
              <span className="text-xs text-slate-500">Aujourd'hui</span>
            </div>

            {activeTreatments.length === 0 ? (
              <EmptyState
                title="Aucun traitement actif"
                description="Votre médecin ne vous a pas encore prescrit de traitement actif."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                {/* Colonne Matin */}
                <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sun className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900">Matin</h3>
                    <span className="ml-auto text-xs font-medium text-amber-700">
                      {morningTreatments.length} prise(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {morningTreatments.length === 0 ? (
                      <p className="text-xs text-slate-400">Aucune prise prévue</p>
                    ) : (
                      morningTreatments.map((t) => {
                        const key = `morning_${t.id}`;
                        const taken = Boolean(takenMap[key]);
                        return (
                          <div
                            key={t.id}
                            className={`rounded-lg border bg-white p-3.5 shadow-sm transition-all ${
                              taken ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm text-slate-800">
                                  {t.medication_name}
                                </p>
                                <p className="text-xs text-slate-500">{t.dosage}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleTaken(key)}
                                className={`rounded-full p-1.5 transition-colors ${
                                  taken
                                    ? "bg-emerald-500 text-white"
                                    : "border border-slate-200 text-slate-400 hover:border-slate-400"
                                }`}
                                title={taken ? "Marqué comme pris" : "Marquer comme pris"}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            </div>
                            {t.instructions && (
                              <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-1.5 rounded">
                                {t.instructions}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Colonne Midi */}
                <div className="rounded-xl bg-sky-50/50 border border-sky-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sunset className="h-4 w-4 text-sky-600" />
                    <h3 className="text-sm font-bold text-sky-900">Midi</h3>
                    <span className="ml-auto text-xs font-medium text-sky-700">
                      {noonTreatments.length} prise(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {noonTreatments.length === 0 ? (
                      <p className="text-xs text-slate-400">Aucune prise prévue</p>
                    ) : (
                      noonTreatments.map((t) => {
                        const key = `noon_${t.id}`;
                        const taken = Boolean(takenMap[key]);
                        return (
                          <div
                            key={t.id}
                            className={`rounded-lg border bg-white p-3.5 shadow-sm transition-all ${
                              taken ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm text-slate-800">
                                  {t.medication_name}
                                </p>
                                <p className="text-xs text-slate-500">{t.dosage}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleTaken(key)}
                                className={`rounded-full p-1.5 transition-colors ${
                                  taken
                                    ? "bg-emerald-500 text-white"
                                    : "border border-slate-200 text-slate-400 hover:border-slate-400"
                                }`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            </div>
                            {t.instructions && (
                              <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-1.5 rounded">
                                {t.instructions}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Colonne Soir */}
                <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Moon className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-indigo-900">Soir</h3>
                    <span className="ml-auto text-xs font-medium text-indigo-700">
                      {eveningTreatments.length} prise(s)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {eveningTreatments.length === 0 ? (
                      <p className="text-xs text-slate-400">Aucune prise prévue</p>
                    ) : (
                      eveningTreatments.map((t) => {
                        const key = `evening_${t.id}`;
                        const taken = Boolean(takenMap[key]);
                        return (
                          <div
                            key={t.id}
                            className={`rounded-lg border bg-white p-3.5 shadow-sm transition-all ${
                              taken ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-semibold text-sm text-slate-800">
                                  {t.medication_name}
                                </p>
                                <p className="text-xs text-slate-500">{t.dosage}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleTaken(key)}
                                className={`rounded-full p-1.5 transition-colors ${
                                  taken
                                    ? "bg-emerald-500 text-white"
                                    : "border border-slate-200 text-slate-400 hover:border-slate-400"
                                }`}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            </div>
                            {t.instructions && (
                              <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-1.5 rounded">
                                {t.instructions}
                              </p>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Liste détaillée des prescriptions avec jauge d'avancement */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-800 mb-4">
              Tous mes traitements prescrits ({treatments.length})
            </h2>

            <div className="divide-y divide-slate-100">
              {treatments.map((t) => {
                let progress = null;
                if (t.start_date && t.end_date) {
                  const s = new Date(t.start_date);
                  const e = new Date(t.end_date);
                  const now = new Date();
                  const total = Math.max(1, e.getTime() - s.getTime());
                  const elapsed = Math.max(0, now.getTime() - s.getTime());
                  progress = Math.min(100, Math.round((elapsed / total) * 100));
                }

                return (
                  <div key={t.id} className="py-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-brand-600" />
                        <span className="font-semibold text-slate-800">{t.medication_name}</span>
                        <Badge variant={t.status === "ACTIVE" ? "success" : "neutral"}>
                          {t.status === "ACTIVE" ? "En cours" : "Arrêté"}
                        </Badge>
                      </div>
                      <Link
                        to={`/prescriptions/${t.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Voir les détails →
                      </Link>
                    </div>

                    <p className="text-xs text-slate-500">
                      Dosage : <strong>{t.dosage}</strong> • Fréquence : <strong>{t.frequency}</strong>
                      {t.instructions && ` • ${t.instructions}`}
                    </p>

                    {progress !== null && (
                      <div className="pt-1">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Du {formatDate(t.start_date)} au {formatDate(t.end_date)}</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-brand-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
