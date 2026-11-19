
import { useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  MessageSquare,
} from "lucide-react";

import { useMesures } from "../../context/MesuresContext";
import { mesuresApi } from "../../api/mesuresApi";

function formatDate(date) {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  });
}

function formatValue(item) {
  return `${item.valeur}${
    item.valeur_secondaire != null
      ? ` / ${item.valeur_secondaire}`
      : ""
  }`;
}

export default function HistoryPage() {
  const { patientId, types } = useMesures();

  const [typeId, setTypeId] = useState("");
  const [jours, setJours] = useState("30");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;

    let active = true;

    setLoading(true);
    setError("");

    mesuresApi
      .getHistory(patientId, {
        ...(typeId ? { type_mesure_id: typeId } : {}),
        jours: Number(jours),
        page,
        page_size: 10,
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.detail ||
              "Impossible de charger l'historique."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patientId, typeId, jours, page]);

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f5f2] text-[#0d8c7c]">
          <History size={23} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123440] sm:text-3xl">
            Historique des mesures
          </h1>
          <p className="mt-1 text-sm text-[#526f7d]">
            Retrouvez et consultez vos précédentes mesures de santé.
          </p>
        </div>
      </div>

      {/* Filtres */}
      <section className="rounded-[18px] border border-[#e5eaed] bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f5f2] text-[#0d8c7c]">
            <Filter size={19} />
          </div>

          <div>
            <h2 className="font-bold text-[#123440]">
              Filtrer les résultats
            </h2>
            <p className="mt-1 text-xs text-[#78909b]">
              Sélectionnez les critères de recherche.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="filter-type"
              className="mb-2 block text-sm font-medium text-[#526f7d]"
            >
              Type de mesure
            </label>

            <select
              id="filter-type"
              value={typeId}
              onChange={(event) =>
                changeFilter(setTypeId, event.target.value)
              }
              className="min-h-[48px] w-full rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm text-[#173744] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
            >
              <option value="">Tous les types</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nom}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filter-period"
              className="mb-2 block text-sm font-medium text-[#526f7d]"
            >
              Période
            </label>

            <select
              id="filter-period"
              value={jours}
              onChange={(event) =>
                changeFilter(setJours, event.target.value)
              }
              className="min-h-[48px] w-full rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm text-[#173744] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
            >
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">90 derniers jours</option>
              <option value="365">12 derniers mois</option>
            </select>
          </div>
        </div>
      </section>

      {/* Tableau des mesures */}
      <section className="overflow-hidden rounded-[18px] border border-[#e5eaed] bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-[#e8edef] px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#123440]">
              Mes enregistrements
            </h2>
            <p className="mt-1 text-sm text-[#78909b]">
              {total} mesure{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e5f5f2] text-[#0d8c7c]">
            <Activity size={20} />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[230px] flex-col items-center justify-center gap-3 text-sm text-[#78909b]">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#dcefeb] border-t-[#0d8c7c]" />
            Chargement de l'historique...
          </div>
        ) : error ? (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f5f5] text-[#78909b]">
              <History size={27} />
            </div>

            <h3 className="font-semibold text-[#173744]">
              Aucun enregistrement trouvé
            </h3>

            <p className="mt-2 max-w-sm text-sm text-[#78909b]">
              Aucune mesure n'a été enregistrée pour les filtres sélectionnés.
              Essayez une autre période.
            </p>
          </div>
        ) : (
          <>
            {/* Tableau desktop */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#e8edef] bg-[#f5f8f8]">
                    {["Date", "Type de mesure", "Valeur", "Commentaire"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-[#78909b]"
                        >
                          {heading}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf1f2]">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-[#f8fbfa]"
                    >
                      <td className="whitespace-nowrap px-6 py-5 text-sm text-[#526f7d]">
                        <div className="flex items-center gap-2">
                          <CalendarDays
                            size={16}
                            className="text-[#0d8c7c]"
                          />
                          {formatDate(
                            item.date_mesure || item.jour_mesure
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span className="font-semibold text-[#173744]">
                          {item.type_mesure?.nom || "Mesure"}
                        </span>
                      </td>

                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-lg bg-[#e5f5f2] px-3 py-2 text-sm font-bold text-[#08796c]">
                          {formatValue(item)}
                        </span>
                        <span className="ml-2 text-xs text-[#78909b]">
                          {item.type_mesure?.unite || ""}
                        </span>
                      </td>

                      <td className="max-w-xs px-6 py-5 text-sm text-[#526f7d]">
                        {item.commentaire ? (
                          <span className="flex items-start gap-2">
                            <MessageSquare
                              size={15}
                              className="mt-0.5 shrink-0 text-[#78909b]"
                            />
                            {item.commentaire}
                          </span>
                        ) : (
                          <span className="text-[#a0b0b7]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cartes mobile */}
            <div className="space-y-3 p-4 md:hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-[#e5eaed] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[#173744]">
                        {item.type_mesure?.nom || "Mesure"}
                      </h3>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-[#78909b]">
                        <CalendarDays size={14} />
                        {formatDate(
                          item.date_mesure || item.jour_mesure
                        )}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="rounded-lg bg-[#e5f5f2] px-3 py-2 text-sm font-bold text-[#08796c]">
                        {formatValue(item)}
                      </p>
                      <p className="mt-1 text-xs text-[#78909b]">
                        {item.type_mesure?.unite || ""}
                      </p>
                    </div>
                  </div>

                  {item.commentaire && (
                    <div className="mt-3 flex gap-2 border-t border-[#e8edef] pt-3 text-sm text-[#526f7d]">
                      <MessageSquare
                        size={15}
                        className="mt-0.5 shrink-0"
                      />
                      {item.commentaire}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-[#e8edef] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-[#78909b]">
                Page {data.page} sur {totalPages} · {total} mesure(s)
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm font-semibold text-[#526f7d] transition hover:bg-[#f3f7f6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages || loading}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm font-semibold text-[#526f7d] transition hover:bg-[#f3f7f6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
