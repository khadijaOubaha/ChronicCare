
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  CalendarDays,
  Filter,
  Info,
  ChartLine,
  ClipboardList,
} from "lucide-react";

import { useMesures } from "../../context/MesuresContext";
import { mesuresApi } from "../../api/mesuresApi";
import EvolutionChart from "./EvolutionChart";

function formatChartDate(date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Africa/Casablanca",
  });
}

export default function EvolutionPage() {
  const { patientId, profil, types } = useMesures();

  const [jours, setJours] = useState("30");
  const [typeId, setTypeId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const primaryTypeId = profil?.type_principal_id;
  const selectedTypeId = typeId || primaryTypeId || "";

  useEffect(() => {
    if (!patientId || !selectedTypeId) {
      setData(null);
      setLoading(false);
      return;
    }

    let active = true;

    setLoading(true);
    setError("");

    mesuresApi
      .getChart(patientId, {
        type_mesure_id: selectedTypeId,
        jours: Number(jours),
      })
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Impossible de charger l'évolution."
          );
          setData(null);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [patientId, selectedTypeId, jours]);

  const points = (data?.points || []).map((point) => ({
    label: formatChartDate(point.jour || point.date_mesure),
    v1: Number(point.valeur),
    v2:
      point.valeur_secondaire != null
        ? Number(point.valeur_secondaire)
        : null,
  }));

  const selectedType = types.find(
    (type) => String(type.id) === String(selectedTypeId)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {/* En-tête */}
      <div>
        <Link
          to="/mesures"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-teal-700"
        >
          <ArrowLeft size={17} />
          Retour à mes mesures
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-teal-700">
              <TrendingUp size={17} />
              Analyse de santé
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Évolution de mes mesures
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Suivez l'évolution de vos données de santé et visualisez vos
              mesures au fil du temps.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <ChartLine size={27} />
          </div>
        </div>
      </div>

      {/* Information */}
      <div className="flex gap-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
          <Info size={19} />
        </div>

        <div>
          <p className="text-sm font-semibold text-teal-900">
            Comprendre votre évolution
          </p>
          <p className="mt-1 text-sm leading-6 text-teal-800">
            La courbe présente les valeurs que vous avez enregistrées pendant
            la période sélectionnée. Elle vous permet de suivre leur évolution
            dans le temps.
          </p>
        </div>
      </div>

      {/* Filtres */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Filter size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Paramètres du graphique
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Choisissez les données à visualiser.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="evolution-type"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Type de mesure
            </label>

            <select
              id="evolution-type"
              value={selectedTypeId}
              onChange={(event) => setTypeId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            >
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="evolution-period"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              <span className="inline-flex items-center gap-2">
                <CalendarDays size={15} className="text-slate-500" />
                Période
              </span>
            </label>

            <select
              id="evolution-period"
              value={jours}
              onChange={(event) => setJours(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
          </div>
        </div>
      </section>

      {/* Graphique */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Courbe d'évolution
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {selectedType?.nom || "Évolution de vos mesures"}
              {selectedType?.unite ? ` · ${selectedType.unite}` : ""}
            </p>
          </div>

          {selectedType && (
            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">
              <Activity size={15} />
              {selectedType.nom}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-3 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Chargement du graphique...
          </div>
        ) : error ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : !selectedTypeId ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <ClipboardList size={26} />
            </div>

            <h3 className="font-semibold text-slate-800">
              Aucun type de mesure disponible
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Les types de mesures associés à votre profil ne sont pas encore
              disponibles.
            </p>
          </div>
        ) : !points.length ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <TrendingUp size={27} />
            </div>

            <h3 className="font-semibold text-slate-800">
              Pas encore de données disponibles
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Aucune mesure n'a été enregistrée pour ce type pendant la période
              sélectionnée.
            </p>

            <Link
              to="/mesures/saisir"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
            >
              Enregistrer une mesure
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
              <p className="text-sm text-slate-500">
                {data?.total ?? points.length} point(s) enregistré(s)
              </p>

              <span className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Données disponibles
              </span>
            </div>

            <div className="p-4 sm:p-6">
              <EvolutionChart
                points={points}
                label={selectedType?.nom || "Évolution"}
                unit={selectedType?.unite || ""}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
