import {
  Edit,
  Eye,
  Filter,
  Pill,
  Plus,
  Search,
  Square,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import { fullName } from "../features/patients/patientUtils";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/formatters";

const DISEASE_LABELS = {
  TYPE_2_DIABETES: "Diabète T2",
  HYPERTENSION: "Hypertension",
};

const TABS = [
  { key: "all", label: "Tous" },
  { key: "active", label: "En cours" },
  { key: "finished", label: "Terminés" },
  { key: "stopped", label: "Arrêtés" },
];

export default function PrescriptionsPage() {
  const [params, setParams] = useSearchParams();
  const patientId = params.get("patient") || "";

  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [toStop, setToStop] = useState(null);
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState("");
  const [notice, setNotice] = useState("");

  const patientsQuery = useAsync(() => patientsApi.list({ limit: 100 }));
  const treatmentsQuery = useAsync(
    () => (patientId ? treatmentsApi.forPatient(patientId) : treatmentsApi.mine()),
    [patientId]
  );

  const patientsList = patientsQuery.data?.items ?? (Array.isArray(patientsQuery.data) ? patientsQuery.data : []);
  const patientMap = useMemo(() => new Map(patientsList.map((p) => [p.id, p])), [patientsList]);

  const treatments = treatmentsQuery.data ?? [];

  // Filtrage selon onglet, recherche et filtres
  const filteredTreatments = useMemo(() => {
    return treatments.filter((t) => {
      // Filtre statut / onglet
      const isPastEndDate = t.end_date && new Date(t.end_date) < new Date();
      if (activeTab === "active" && (t.status !== "ACTIVE" || isPastEndDate)) return false;
      if (activeTab === "finished" && (t.status === "STOPPED" || !isPastEndDate)) return false;
      if (activeTab === "stopped" && t.status !== "STOPPED") return false;

      // Filtre pathologie
      if (diseaseFilter && t.disease !== diseaseFilter) return false;

      // Filtre recherche (médicament ou nom patient)
      if (search.trim()) {
        const q = search.toLowerCase();
        const p = patientMap.get(t.patient_id);
        const pName = p ? fullName(p).toLowerCase() : "";
        const med = (t.medication_name || "").toLowerCase();
        if (!pName.includes(q) && !med.includes(q)) return false;
      }

      return true;
    });
  }, [treatments, activeTab, diseaseFilter, search, patientMap]);

  const handleStop = async () => {
    if (!toStop) return;
    setStopping(true);
    setStopError("");
    try {
      await treatmentsApi.stop(toStop.id);
      setToStop(null);
      setNotice("Traitement arrêté avec succès.");
      treatmentsQuery.reload();
    } catch (err) {
      setStopError(getErrorMessage(err));
    } finally {
      setStopping(false);
    }
  };

  const selectPatient = (e) => {
    const val = e.target.value;
    setParams(val ? { patient: val } : {});
  };

  const loading = patientsQuery.loading || treatmentsQuery.loading;
  const error = patientsQuery.error || treatmentsQuery.error;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Prescriptions"
          description="Gérez les ordonnances, ajustez les posologies et suivez les traitements de vos patients."
        />
        <Link to={`/prescriptions/nouveau${patientId ? `?patient=${patientId}` : ""}`}>
          <Button>
            <Plus className="h-4 w-4" /> Nouvelle prescription
          </Button>
        </Link>
      </div>

      {notice && <Alert type="success">{notice}</Alert>}
      {stopError && <Alert>{stopError}</Alert>}

      {/* Barre d'onglets de filtrage */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => {
          let count = treatments.length;
          if (tab.key === "active") {
            count = treatments.filter(
              (t) => t.status === "ACTIVE" && (!t.end_date || new Date(t.end_date) >= new Date())
            ).length;
          } else if (tab.key === "finished") {
            count = treatments.filter(
              (t) => t.status !== "STOPPED" && t.end_date && new Date(t.end_date) < new Date()
            ).length;
          } else if (tab.key === "stopped") {
            count = treatments.filter((t) => t.status === "STOPPED").length;
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-900 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeTab === tab.key
                    ? "bg-brand-50 text-brand-700 font-bold"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filtres de recherche */}
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          icon={Search}
          placeholder="Rechercher par médicament ou patient..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <SelectField
          value={patientId}
          onChange={selectPatient}
          options={[
            { value: "", label: "Tous les patients" },
            ...patientsList.map((p) => ({ value: p.id, label: fullName(p) })),
          ]}
        />

        <SelectField
          value={diseaseFilter}
          onChange={(e) => setDiseaseFilter(e.target.value)}
          options={[
            { value: "", label: "Toutes les pathologies" },
            { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
            { value: "HYPERTENSION", label: "Hypertension artérielle" },
          ]}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => {
            patientsQuery.reload();
            treatmentsQuery.reload();
          }}
        />
      ) : filteredTreatments.length === 0 ? (
        <EmptyState
          title="Aucune prescription trouvée"
          description="Aucune prescription ne correspond aux filtres sélectionnés."
          action={
            <Link to="/prescriptions/nouveau">
              <Button>
                <Plus className="h-4 w-4" /> Créer une prescription
              </Button>
            </Link>
          }
        />
      ) : (
        /* Tableau des Prescriptions */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Médicament & Dosage</th>
                  <th className="px-5 py-3.5">Pathologie</th>
                  <th className="px-5 py-3.5">Posologie</th>
                  <th className="px-5 py-3.5">Période</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTreatments.map((t) => {
                  const p = patientMap.get(t.patient_id);
                  const pName = p ? fullName(p) : "Patient";
                  const pInitials = p
                    ? `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`.toUpperCase()
                    : "P";
                  const isStopped = t.status === "STOPPED";

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Patient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">
                            {pInitials}
                          </div>
                          <div>
                            {p ? (
                              <Link
                                to={`/patients/${p.id}`}
                                className="font-semibold text-slate-800 hover:text-brand-600"
                              >
                                {pName}
                              </Link>
                            ) : (
                              <span className="font-semibold text-slate-800">{pName}</span>
                            )}
                            {p?.email && <p className="text-xs text-slate-400">{p.email}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Médicament & Dosage */}
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Pill className="h-4 w-4 text-brand-600" />
                          <span>{t.medication_name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{t.dosage}</span>
                      </td>

                      {/* Pathologie */}
                      <td className="px-5 py-3.5">
                        <Badge variant="brand">
                          {DISEASE_LABELS[t.disease] || t.disease || "Standard"}
                        </Badge>
                      </td>

                      {/* Fréquence */}
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {t.frequency}
                      </td>

                      {/* Période */}
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        Du {formatDate(t.start_date)}
                        {t.end_date ? ` au ${formatDate(t.end_date)}` : " (continu)"}
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3.5">
                        <Badge variant={isStopped ? "neutral" : "success"}>
                          {isStopped ? "Arrêté" : "En cours"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/prescriptions/${t.id}`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Consulter"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          {!isStopped && (
                            <>
                              <Link
                                to={`/prescriptions/${t.id}/modifier`}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Modifier"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => setToStop(t)}
                                className="rounded p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Arrêter le traitement"
                              >
                                <Square className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal confirmation arrêt */}
      {toStop && (
        <Modal
          open={Boolean(toStop)}
          onClose={() => setToStop(null)}
          title="Arrêter le traitement"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirmez-vous l'arrêt du traitement{" "}
              <strong>{toStop.medication_name}</strong> pour ce patient ? Cette action
              est définitive.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setToStop(null)}
                disabled={stopping}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleStop} loading={stopping}>
                Arrêter le traitement
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
