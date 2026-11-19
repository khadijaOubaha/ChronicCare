import {
  Activity,
  Eye,
  FileText,
  Pencil,
  Plus,
  Power,
  Search,
  Trash2,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Modal, { ConfirmDialog } from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { patientsApi } from "../api/patientsApi";
import { fullName } from "../features/patients/patientUtils";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../utils/errors";
import { SEX_LABELS, ageFrom } from "../utils/format";

const PAGE = 20;

const DISEASE_LABELS = {
  TYPE_2_DIABETES: "Diabète T2",
  HYPERTENSION: "Hypertension",
};

export default function PatientsPage() {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [diseaseFilter, setDiseaseFilter] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  // Appel avec filtres vers l'API Patients
  const { data, loading, error, reload } = useAsync(
    () =>
      patientsApi.list({
        offset,
        limit: PAGE,
        search: query.trim() || undefined,
        status: statusFilter || undefined,
        disease: diseaseFilter || undefined,
      }),
    [offset, query, statusFilter, diseaseFilter]
  );

  const patients = data?.items ?? (Array.isArray(data) ? data : []);
  const total = data?.total ?? patients.length;

  const run = async (fn, okMessage) => {
    setBusy(true);
    setActionError("");
    setNotice("");
    try {
      await fn();
      setNotice(okMessage);
      await reload();
      return true;
    } catch (e) {
      setActionError(getErrorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = (p) =>
    run(
      () => patientsApi.update(p.id, { is_active: !p.is_active }),
      p.is_active ? "Dossier patient désactivé." : "Dossier patient réactivé."
    );

  const confirmDelete = async () => {
    if (await run(() => patientsApi.remove(toDelete.id), "Dossier patient supprimé.")) {
      setToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title="Patients"
          description={`Gérez les dossiers médicaux (${total} patient${total > 1 ? "s" : ""}).`}
        />
        <Link to="/patients/nouveau">
          <Button>
            <Plus className="h-4 w-4" /> Nouveau patient
          </Button>
        </Link>
      </div>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      {/* Barre de recherche et filtres */}
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          icon={Search}
          placeholder="Rechercher par nom, prénom ou email..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOffset(0);
          }}
        />

        <SelectField
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          options={[
            { value: "", label: "Tous les statuts" },
            { value: "active", label: "Actifs uniquement" },
            { value: "inactive", label: "Inactifs uniquement" },
          ]}
        />

        <SelectField
          value={diseaseFilter}
          onChange={(e) => {
            setDiseaseFilter(e.target.value);
            setOffset(0);
          }}
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
        <ErrorState error={error} onRetry={reload} />
      ) : patients.length === 0 ? (
        <EmptyState
          title="Aucun patient trouvé"
          description={
            query || statusFilter || diseaseFilter
              ? "Aucun dossier patient ne correspond à vos critères de recherche."
              : "Créez votre premier dossier patient en cliquant sur « Nouveau patient »."
          }
          action={
            <Link to="/patients/nouveau">
              <Button>
                <Plus className="h-4 w-4" /> Nouveau patient
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Âge & Sexe</th>
                  <th className="px-5 py-3.5">Pathologie</th>
                  <th className="px-5 py-3.5">Coordonnées</th>
                  <th className="px-5 py-3.5">Statut</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {patients.map((p) => {
                  const initials = `${p.first_name?.[0] || ""}${p.last_name?.[0] || ""}`.toUpperCase();
                  const age = ageFrom(p.date_of_birth);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Patient Identité */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-bold text-white shadow-inner">
                            {initials}
                          </div>
                          <div>
                            <Link
                              to={`/patients/${p.id}`}
                              className="font-semibold text-slate-800 hover:text-brand-600"
                            >
                              {fullName(p)}
                            </Link>
                            <p className="text-xs text-slate-400">{p.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Âge & Sexe */}
                      <td className="px-5 py-3.5 text-slate-600">
                        <span>{age ? `${age} ans` : "—"}</span>
                        <span className="text-xs text-slate-400 block">
                          {p.sex === "M" ? "Homme" : p.sex === "F" ? "Femme" : "—"}
                        </span>
                      </td>

                      {/* Pathologie */}
                      <td className="px-5 py-3.5">
                        {p.disease ? (
                          <Badge variant="brand">
                            {DISEASE_LABELS[p.disease] || p.disease}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Non spécifiée</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        <div>{p.phone || "Téléphone non renseigné"}</div>
                        {p.address && <div className="text-slate-400 truncate max-w-xs">{p.address}</div>}
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3.5">
                        <Badge variant={p.is_active ? "success" : "neutral"}>
                          {p.is_active ? "Actif" : "Inactif"}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/patients/${p.id}`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Consulter le dossier"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/patients/${p.id}/dossier`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Dossier médical complet"
                          >
                            <FileText className="h-4 w-4" />
                          </Link>
                          <Link
                            to={`/patients/${p.id}/modifier`}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleActive(p)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            title={p.is_active ? "Désactiver" : "Réactiver"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(p)}
                            className="rounded p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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

      {/* Pagination */}
      {!loading && !error && total > PAGE && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Affichage de {offset + 1} à {Math.min(offset + PAGE, total)} sur {total} patients
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE))}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              disabled={offset + PAGE >= total}
              onClick={() => setOffset(offset + PAGE)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {toDelete && (
        <ConfirmDialog
          danger
          title="Supprimer ce patient ?"
          confirmLabel="Supprimer définitivement"
          loading={busy}
          message={`Le dossier de ${fullName(toDelete)} sera supprimé définitivement. Pour conserver l'historique, vous pouvez plutôt désactiver le patient.`}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </div>
  );
}
