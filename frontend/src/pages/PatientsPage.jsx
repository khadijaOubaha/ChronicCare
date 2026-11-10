import { FileText, Pencil, Plus, Power, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { patientsApi } from "../api/patientsApi";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import TextField from "../components/ui/TextField";
import PatientFormModal from "../features/patients/PatientFormModal";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../utils/errors";
import { SEX_LABELS, ageFrom, fullName } from "../utils/format";

const PAGE = 20;
const iconBtn = "rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800";

export default function PatientsPage() {
  const [offset, setOffset] = useState(0);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // { patient? }
  const [toDelete, setToDelete] = useState(null);
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, loading, error, reload } = useAsync(() => patientsApi.list({ offset, limit: PAGE }), [offset]);
  const patients = data ?? [];

  // Le backend n'a pas de recherche : filtre sur la page affichée uniquement.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? patients.filter((p) => `${fullName(p)} ${p.email ?? ""}`.toLowerCase().includes(q)) : patients;
  }, [patients, query]);

  const run = async (fn, okMessage) => {
    setBusy(true); setActionError(""); setNotice("");
    try { await fn(); setNotice(okMessage); await reload(); return true; }
    catch (e) { setActionError(getErrorMessage(e)); return false; }
    finally { setBusy(false); }
  };

  const toggleActive = (p) =>
    run(() => patientsApi.update(p.id, { is_active: !p.is_active }), p.is_active ? "Patient désactivé." : "Patient réactivé.");

  const confirmDelete = async () => {
    if (await run(() => patientsApi.remove(toDelete.id), "Patient supprimé.")) setToDelete(null);
    else setToDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Gérez les dossiers de vos patients."
        actions={<Button onClick={() => setModal({})}><Plus className="h-4 w-4" aria-hidden="true" />Nouveau patient</Button>}
      />
      <div className="mb-4 space-y-3">
        {notice && <Alert type="success">{notice}</Alert>}
        {actionError && <Alert>{actionError}</Alert>}
        <div className="max-w-sm"><TextField label="Rechercher dans cette page" icon={Search} placeholder="Nom ou e-mail" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState error={error} onRetry={reload} /> : filtered.length === 0 ? (
        <EmptyState title={patients.length ? "Aucun résultat sur cette page" : "Aucun patient"}>
          {patients.length ? "Modifiez votre recherche." : "Créez le premier dossier avec « Nouveau patient »."}
        </EmptyState>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>{["Patient", "Âge", "Sexe", "Contact", "Statut", "Actions"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">{fullName(p)}</td>
                  <td className="px-4 text-slate-600">{ageFrom(p.date_of_birth) ?? "—"}{p.date_of_birth ? " ans" : ""}</td>
                  <td className="px-4 text-slate-600">{SEX_LABELS[p.sex] ?? "—"}</td>
                  <td className="px-4 text-slate-600">{p.email ?? p.phone ?? "—"}</td>
                  <td className="px-4"><Badge tone={p.is_active ? "green" : "slate"}>{p.is_active ? "Actif" : "Inactif"}</Badge></td>
                  <td className="px-4">
                    <div className="flex gap-1">
                      <Link to={`/prescriptions?patient=${p.id}`} className={iconBtn} aria-label={`Prescriptions de ${fullName(p)}`} title="Prescriptions"><FileText className="h-4 w-4" /></Link>
                      <button type="button" className={iconBtn} aria-label={`Modifier ${fullName(p)}`} title="Modifier" onClick={() => setModal({ patient: p })}><Pencil className="h-4 w-4" /></button>
                      <button type="button" disabled={busy} className={iconBtn} aria-label={p.is_active ? "Désactiver" : "Réactiver"} title={p.is_active ? "Désactiver" : "Réactiver"} onClick={() => toggleActive(p)}><Power className="h-4 w-4" /></button>
                      <button type="button" className={`${iconBtn} hover:text-red-600`} aria-label={`Supprimer ${fullName(p)}`} title="Supprimer" onClick={() => setToDelete(p)}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && !error && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>Patients {offset + 1} à {offset + patients.length}</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE))}>Précédent</Button>
            <Button variant="secondary" disabled={patients.length < PAGE} onClick={() => setOffset(offset + PAGE)}>Suivant</Button>
          </div>
        </div>
      )}

      {modal && (
        <PatientFormModal patient={modal.patient} onClose={() => setModal(null)}
          onSaved={(msg) => { setModal(null); setNotice(msg); reload(); }} />
      )}
      {toDelete && (
        <ConfirmDialog danger title="Supprimer ce patient ?" confirmLabel="Supprimer" loading={busy}
          message={`Le dossier de ${fullName(toDelete)} sera supprimé définitivement. Pour conserver l'historique, préférez « Désactiver ».`}
          onConfirm={confirmDelete} onClose={() => setToDelete(null)} />
      )}
    </div>
  );
}
