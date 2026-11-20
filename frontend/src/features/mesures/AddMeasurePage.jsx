
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Save,
} from "lucide-react";

import { useMesures } from "../../context/MesuresContext";
import { mesuresApi } from "../../api/mesuresApi";

function formatToday(date) {
  const value = date ? new Date(`${date}T12:00:00`) : new Date();

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Africa/Casablanca",
  }).format(value);
}

function TodaySummary({ cartes }) {
  return (
    <aside className="rounded-[18px] border border-[#e5eaed] bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList size={20} className="text-[#0d8c7c]" />
        <h2 className="text-lg font-bold text-[#123440]">
          Mesures du jour
        </h2>
      </div>

      {cartes.length === 0 ? (
        <p className="py-4 text-sm text-[#526f7d]">
          Aucune mesure prévue aujourd'hui.
        </p>
      ) : (
        <div>
          {cartes.map((carte) => {
            const recorded = carte.statut === "enregistree";

            return (
              <div
                key={carte.type_mesure.id}
                className="flex items-center justify-between gap-3 border-b border-[#e8edef] py-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#173744]">
                    {carte.type_mesure.nom}
                  </p>

                  {recorded && carte.mesure && (
                    <p className="mt-1 text-sm text-[#526f7d]">
                      {carte.mesure.valeur}
                      {carte.mesure.valeur_secondaire != null
                        ? ` / ${carte.mesure.valeur_secondaire}`
                        : ""}
                      {" "}
                      {carte.type_mesure.unite}
                    </p>
                  )}
                </div>

                <span
                  className={`shrink-0 text-right text-xs font-bold sm:text-sm ${
                    recorded ? "text-[#078575]" : "text-[#b45309]"
                  }`}
                >
                  {recorded ? "Enregistrée" : "À renseigner"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default function AddMeasurePage() {
  const { patientId, types, resume, refresh, loading } = useMesures();

  const [typeId, setTypeId] = useState("");
  const [valeur, setValeur] = useState("");
  const [valeurSecondaire, setValeurSecondaire] = useState("");
  const [commentaire, setCommentaire] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedType = types.find((type) => type.id === typeId);
  const cartes = resume?.cartes ?? [];

  const alreadyRecorded = cartes.some(
    (carte) =>
      carte.type_mesure.id === typeId &&
      carte.statut === "enregistree"
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!patientId || !selectedType) {
      setError("Veuillez sélectionner un type de mesure.");
      return;
    }

    const number = Number(valeur);
    const secondary = Number(valeurSecondaire);

    if (valeur.trim() === "" || !Number.isFinite(number)) {
      setError("Veuillez saisir une valeur numérique valide.");
      return;
    }

    if (
      number < selectedType.valeur_min ||
      number > selectedType.valeur_max
    ) {
      setError(
        `La valeur doit être comprise entre ${selectedType.valeur_min} et ${selectedType.valeur_max}.`
      );
      return;
    }

    if (selectedType.deux_valeurs) {
      if (
        valeurSecondaire.trim() === "" ||
        !Number.isFinite(secondary)
      ) {
        setError("Veuillez saisir la deuxième valeur.");
        return;
      }

      if (
        secondary < selectedType.valeur_secondaire_min ||
        secondary > selectedType.valeur_secondaire_max
      ) {
        setError(
          `La deuxième valeur doit être comprise entre ${selectedType.valeur_secondaire_min} et ${selectedType.valeur_secondaire_max}.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      await mesuresApi.create(patientId, {
        type_mesure_id: typeId,
        valeur: number,
        ...(selectedType.deux_valeurs
          ? { valeur_secondaire: secondary }
          : {}),
        ...(commentaire.trim()
          ? { commentaire: commentaire.trim() }
          : {}),
      });

      await refresh();

      setSuccess("La mesure a été enregistrée avec succès.");
      setValeur("");
      setValeurSecondaire("");
      setCommentaire("");
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Une mesure de ce type est déjà enregistrée aujourd'hui.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Une erreur est survenue lors de l'enregistrement."
        );
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-[#526f7d]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0d9488] border-t-transparent" />
        Chargement des mesures...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f5f2] text-[#0d8c7c]">
          <Activity size={23} />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#123440] sm:text-3xl">
            Enregistrer une mesure
          </h1>
          <p className="mt-1 text-sm text-[#526f7d]">
            Renseignez vos données de santé quotidiennes.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_0.95fr]">
        {/* Formulaire */}
        <section className="rounded-[18px] border border-[#e5eaed] bg-white p-5 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="typeId"
                className="mb-2 block text-sm font-medium text-[#526f7d]"
              >
                Type de mesure
              </label>

              <select
                id="typeId"
                value={typeId}
                onChange={(event) => {
                  setTypeId(event.target.value);
                  setValeur("");
                  setValeurSecondaire("");
                  setError("");
                  setSuccess("");
                }}
                className="min-h-[52px] w-full rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm text-[#173744] outline-none transition focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
                required
              >
                <option value="">Sélectionner un type de mesure</option>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.nom} ({type.unite})
                  </option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="valeur"
                    className="mb-2 block text-sm font-medium text-[#526f7d]"
                  >
                    {selectedType.libelle_valeur || "Valeur"} (
                    {selectedType.unite})
                  </label>

                  <input
                    id="valeur"
                    type="number"
                    step="any"
                    value={valeur}
                    onChange={(event) => setValeur(event.target.value)}
                    min={selectedType.valeur_min}
                    max={selectedType.valeur_max}
                    placeholder="Saisir la valeur"
                    required
                    className="min-h-[52px] w-full rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm text-[#173744] outline-none transition placeholder:text-slate-400 focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
                  />

                  <p className="mt-2 text-xs text-[#78909b]">
                    Valeur autorisée : {selectedType.valeur_min} à{" "}
                    {selectedType.valeur_max} {selectedType.unite}
                  </p>
                </div>

                {selectedType.deux_valeurs && (
                  <div>
                    <label
                      htmlFor="valeurSecondaire"
                      className="mb-2 block text-sm font-medium text-[#526f7d]"
                    >
                      {selectedType.libelle_valeur_secondaire ||
                        "Deuxième valeur"}
                    </label>

                    <input
                      id="valeurSecondaire"
                      type="number"
                      step="any"
                      value={valeurSecondaire}
                      onChange={(event) =>
                        setValeurSecondaire(event.target.value)
                      }
                      min={selectedType.valeur_secondaire_min}
                      max={selectedType.valeur_secondaire_max}
                      placeholder="Saisir la deuxième valeur"
                      required
                      className="min-h-[52px] w-full rounded-xl border border-[#d7e0e4] bg-white px-4 text-sm text-[#173744] outline-none transition placeholder:text-slate-400 focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
                    />

                    <p className="mt-2 text-xs text-[#78909b]">
                      Valeur autorisée :{" "}
                      {selectedType.valeur_secondaire_min} à{" "}
                      {selectedType.valeur_secondaire_max}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label
                htmlFor="dateMesure"
                className="mb-2 block text-sm font-medium text-[#526f7d]"
              >
                Date
              </label>

              <input
                id="dateMesure"
                type="text"
                value={`${formatToday(resume?.date_du_jour)} (Africa/Casablanca)`}
                readOnly
                className="min-h-[52px] w-full rounded-xl border border-[#e5eaed] bg-[#f3f6f7] px-4 text-sm text-[#173744] outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="commentaire"
                className="mb-2 block text-sm font-medium text-[#526f7d]"
              >
                Commentaire
                <span className="ml-1 text-xs text-slate-400">
                  (facultatif)
                </span>
              </label>

              <textarea
                id="commentaire"
                value={commentaire}
                onChange={(event) => setCommentaire(event.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Ajouter une remarque..."
                className="w-full resize-y rounded-xl border border-[#d7e0e4] bg-white px-4 py-3 text-sm text-[#173744] outline-none transition placeholder:text-slate-400 focus:border-[#0d9488] focus:ring-2 focus:ring-[#0d9488]/15"
              />
              <p className="mt-1 text-right text-xs text-slate-400">
                {commentaire.length}/500
              </p>
            </div>

            {alreadyRecorded && (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <AlertCircle size={19} className="shrink-0" />
                <p>
                  Cette mesure est déjà enregistrée aujourd'hui. Vous
                  pourrez l'enregistrer à nouveau demain.
                </p>
              </div>
            )}

            {error && (
              <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={19} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 size={19} className="shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={saving || !selectedType || alreadyRecorded}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0d8c7c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#08796c] focus:outline-none focus:ring-2 focus:ring-[#0d9488] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? "Enregistrement..." : "Enregistrer la mesure"}
              </button>

              <Link
                to="/mesures"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#d7e0e4] bg-white px-6 py-3 text-sm font-semibold text-[#526f7d] transition hover:bg-[#f3f6f7]"
              >
                Annuler
              </Link>
            </div>

            <p className="text-xs text-[#78909b]">
              Un seul type de mesure par enregistrement.
            </p>
          </form>
        </section>

        {/* Récapitulatif des mesures du jour */}
        <TodaySummary cartes={cartes} />
      </div>
    </div>
  );
}
