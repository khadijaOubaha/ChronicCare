
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  HeartPulse,
  Scale,
  Thermometer,
  Droplets,
} from "lucide-react";

import { useMesures } from "../../context/MesuresContext";

function formatToday(date) {
  const value = date ? new Date(`${date}T12:00:00`) : new Date();

  const formatted = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  }).format(value);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatValue(mesure, unite) {
  if (!mesure || mesure.valeur == null) return "—";

  const principale = mesure.valeur;
  const secondaire = mesure.valeur_secondaire;

  return (
    <>
      {principale}
      {secondaire != null ? ` / ${secondaire}` : ""}
      <span className="ml-1 text-sm font-medium text-slate-500">
        {unite}
      </span>
    </>
  );
}

function getMeasureIcon(name = "") {
  const value = name.toLowerCase();

  if (value.includes("glyc")) return Droplets;
  if (value.includes("poids")) return Scale;
  if (value.includes("temp")) return Thermometer;
  if (value.includes("tension")) return HeartPulse;

  return Activity;
}

function getDiseaseName(diseaseType) {
  if (diseaseType === "TYPE_2_DIABETES" || diseaseType === "diabetes_type_2") {
    return "Diabète de type 2";
  }

  if (diseaseType === "HYPERTENSION" || diseaseType === "hypertension") {
    return "Hypertension";
  }

  return "Suivi de santé";
}

function MeasureCard({ carte }) {
  const enregistree = carte.statut === "enregistree";
  const Icon = getMeasureIcon(carte.type_mesure?.nom);

  return (
    <article className="min-w-0 rounded-[18px] border border-[#e5eaed] bg-white px-5 py-5 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-[#526f7d]">
          {carte.type_mesure.nom}
        </p>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            enregistree
              ? "bg-[#e5f5f2] text-[#0d8c7c]"
              : "bg-[#fff3e8] text-[#b45309]"
          }`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-2 truncate text-2xl font-bold tracking-tight text-[#123440]">
        {enregistree
          ? formatValue(carte.mesure, carte.type_mesure.unite)
          : (
            <>
              —{" "}
              <span className="text-sm font-medium text-slate-500">
                {carte.type_mesure.unite}
              </span>
            </>
          )}
      </p>

      <p
        className={`mt-2 text-[13px] font-bold ${
          enregistree ? "text-[#078575]" : "text-[#b45309]"
        }`}
      >
        {enregistree ? "Enregistrée" : "À renseigner"}
      </p>
    </article>
  );
}

export default function TodayPage() {
  const { profil, resume, loading, error } = useMesures();

  if (loading) {
    return (
      <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-[#526f7d]">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#0d9488]" />
        <p className="text-sm">Chargement de vos mesures...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[18px] border border-red-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <Activity className="mt-1 text-red-600" size={22} />
          <div>
            <h2 className="font-bold text-[#123440]">
              Impossible de charger vos mesures
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Une erreur est survenue. Veuillez réessayer ultérieurement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cartes = resume?.cartes ?? [];
  const enregistrees = resume?.enregistrees ?? 0;
  const total = resume?.total ?? cartes.length;
  const date = resume?.date_du_jour;

  // Toutes les mesures sont enregistrées lorsque le total est atteint.
  const toutesEnregistrees = total > 0 && enregistrees >= total;

  const restantes = Math.max(total - enregistrees, 0);

  const progress =
    total > 0 ? Math.min(Math.round((enregistrees / total) * 100), 100) : 0;

  const diseaseName = getDiseaseName(profil?.patient?.disease_type);

  const message = toutesEnregistrees
    ? "Toutes vos mesures du jour sont enregistrées."
    : enregistrees === 0
      ? `Aucune mesure enregistrée. Il vous reste ${restantes} à renseigner.`
      : `${enregistrees} mesure${enregistrees > 1 ? "s" : ""} enregistrée${enregistrees > 1 ? "s" : ""}. Il vous en reste ${restantes}.`;

  return (
    <div className="space-y-6">
      {/* Bannière de suivi */}
      <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#104e60] to-[#176b75] px-6 py-8 text-white sm:px-8 sm:py-9">
        <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-teal-100">
              <HeartPulse size={18} />
              Mon suivi de santé
            </div>

            <p className="text-sm leading-relaxed text-white/90">
              {message} {formatToday(date)}.
            </p>

            {!toutesEnregistrees && (
              <Link
                to="/mesures/saisir"
                className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#19aa9a] px-5 py-3 text-sm font-bold text-[#073c46] transition hover:bg-[#25bbaa] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#145b68]"
              >
                Saisir une mesure
                <ArrowRight size={17} />
              </Link>
            )}
          </div>

          <div className="flex min-w-[170px] items-center justify-between gap-5 rounded-[18px] bg-white/15 px-6 py-5 sm:min-w-[200px] sm:flex-col sm:items-start">
            <div>
              <p className="text-sm font-medium text-teal-50">
                Progression du jour
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">
                {enregistrees} / {total}
              </p>
            </div>

            <div className="h-2 w-20 overflow-hidden rounded-full bg-white/25 sm:w-full">
              <div
                className="h-full rounded-full bg-[#25c5ad] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cartes des mesures */}
      <section
        aria-label="Mesures du jour"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {cartes.map((carte) => (
          <MeasureCard key={carte.type_mesure.id} carte={carte} />
        ))}
      </section>

      {/* Rappel et accès à l'historique */}
      <section className="flex flex-col justify-between gap-4 rounded-[18px] border border-[#e5eaed] bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e5f5f2] text-[#0d8c7c]">
            <HeartPulse size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[#123440]">
              {diseaseName}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#526f7d]">
              Une seule mesure par type et par jour. Une mesure enregistrée
              ne peut plus être modifiée.
            </p>
          </div>
        </div>

        <Link
          to="/mesures/historique"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0d8c7c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#08796c]"
        >
          <ClipboardList size={17} />
          Voir l'historique
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
