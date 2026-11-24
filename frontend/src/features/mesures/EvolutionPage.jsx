
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
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
    <div className="mx-auto max-w-6xl space-y-4 pb-6">
      {/* En-tête */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-teal-700">
            <TrendingUp size={15} />
            Analyse de santé
          </div>

          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Évolution de mes mesures
          </h1>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-slate-500">
            Suivez l'évolution de vos données de santé et visualisez vos
            mesures au fil du temps.
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <ChartLine size={21} />
        </div>
      </div>

      {/* Information */}
      <div className="flex gap-2.5 rounded-xl border border-teal-100 bg-teal-50/70 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700">
          <Info size={16} />
        </div>

        <div>
          <p className="text-xs font-semibold text-teal-900">
            Comprendre votre évolution
          </p>
          <p className="mt-1 text-xs leading-5 text-teal-800">
            La courbe présente les valeurs que vous avez enregistrées pendant
            la période sélectionnée. Elle vous permet de suivre leur évolution
            dans le temps.
          </p>
        </div>
      </div>

      {/* Filtres */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Filter size={16} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Paramètres du graphique
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Choisissez les données à visualiser.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="evolution-type"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Type de mesure
            </label>

            <select
              id="evolution-type"
              value={selectedTypeId}
              onChange={(event) => setTypeId(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-50"
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
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={13} className="text-slate-500" />
                Période
              </span>
            </label>

            <select
              id="evolution-period"
              value={jours}
              onChange={(event) => setJours(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-50"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
          </div>
        </div>
      </section>

      {/* Graphique */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2.5 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Courbe d'évolution
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              {selectedType?.nom || "Évolution de vos mesures"}
              {selectedType?.unite ? ` · ${selectedType.unite}` : ""}
            </p>
          </div>

          {selectedType && (
            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-800">
              <Activity size={13} />
              {selectedType.nom}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center gap-2 text-xs text-slate-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            Chargement du graphique...
          </div>
        ) : error ? (
          <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        ) : !selectedTypeId ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <ClipboardList size={21} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Aucun type de mesure disponible
            </h3>

            <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
              Les types de mesures associés à votre profil ne sont pas encore
              disponibles.
            </p>
          </div>
        ) : !points.length ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <TrendingUp size={22} />
            </div>

            <h3 className="text-sm font-semibold text-slate-800">
              Pas encore de données disponibles
            </h3>

            <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-500">
              Aucune mesure n'a été enregistrée pour ce type pendant la période
              sélectionnée.
            </p>

            <Link
              to="/mesures/saisir"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-teal-800"
            >
              Enregistrer une mesure
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 px-4 pt-4">
              <p className="text-xs text-slate-500">
                {data?.total ?? points.length} point(s) enregistré(s)
              </p>

              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Données disponibles
              </span>
            </div>

            <div className="p-3 sm:p-4">
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
