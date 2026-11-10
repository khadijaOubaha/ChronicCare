import { Pencil, Plus, Square } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import Tabs from "../components/ui/Tabs";
import TreatmentCard from "../features/treatments/TreatmentCard";
import TreatmentFormModal from "../features/treatments/TreatmentFormModal";
import { useAsync } from "../hooks/useAsync";
import { getErrorMessage } from "../utils/errors";
import { fullName } from "../utils/format";

export default function PrescriptionsPage() {
  const [params, setParams] = useSearchParams();
  const patientId = params.get("patient") || "";
  const [modal, setModal] = useState(params.get("new") ? {} : null); // { treatment? }
  const [toStop, setToStop] = useState(null);
  const [tab, setTab] = useState("active");
  const [notice, setNotice] = useState("");
  const [stopError, setStopError] = useState("");
  const [stopping, setStopping] = useState(false);

  // Max 100 patients (limite du backend) : sert au sélecteur et aux noms affichés.
  const patients = useAsync(() => patientsApi.list({ limit: 100 }));
  const treatments = useAsync(
    () => (patientId ? treatmentsApi.forPatient(patientId) : treatmentsApi.mine()),
    [patientId]
  );

  const names = useMemo(() => new Map((patients.data ?? []).map((p) => [p.id, fullName(p)])), [patients.data]);
  const all = treatments.data ?? [];
  const active = all.filter((t) => t.status === "ACTIVE");
  const history = all.filter((t) => t.status !== "ACTIVE");
  const shown = tab === "active" ? active : history;

  const selectPatient = (e) => setParams(e.target.value ? { patient: e.target.value } : {});

  const stop = async () => {
    setStopping(true); setStopError("");
    try {
      await treatmentsApi.stop(toStop.id);
      setToStop(null); setNotice("Traitement arrêté."); treatments.reload();
    } catch (e) {
      setStopError(getErrorMessage(e));
    } finally { setStopping(false); }
  };

  const closeModal = () => { setModal(null); if (params.get("new")) setParams(patientId ? { patient: patientId } : {}); };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Prescriptions"
        description="Prescrivez, modifiez ou arrêtez les traitements de vos patients."
        actions={<Button onClick={() => setModal({})}><Plus className="h-4 w-4" aria-hidden="true" />Nouvelle prescription</Button>}
      />
      {notice && <Alert type="success">{notice}</Alert>}
      {patients.error && <Alert>Liste des patients indisponible : {getErrorMessage(patients.error)}</Alert>}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <SelectField className="w-full max-w-xs" label="Patient" placeholder="Tous les patients"
          options={(patients.data ?? []).map((p) => ({ value: p.id, label: fullName(p) }))}
          value={patientId} onChange={selectPatient} />
        {!treatments.loading && !treatments.error && (
          <Tabs value={tab} onChange={setTab} tabs={[
            { id: "active", label: `En cours (${active.length})` },
            { id: "history", label: `Historique (${history.length})` },
          ]} />
        )}
      </div>

      {treatments.loading ? <LoadingState /> : treatments.error ? (
        <ErrorState error={treatments.error} onRetry={treatments.reload} />
      ) : shown.length === 0 ? (
        <EmptyState title="Aucune prescription">
          {tab === "active" ? "Aucun traitement en cours pour cette sélection." : "L'historique est vide pour cette sélection."}
        </EmptyState>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((t) => (
            <TreatmentCard
              key={t.id}
              treatment={t}
              patientName={names.get(t.patient_id) ?? "Patient hors des 100 premiers"}
              actions={t.status === "ACTIVE" && (
                <>
                  <button type="button" aria-label="Modifier" title="Modifier" onClick={() => setModal({ treatment: t })}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" aria-label="Arrêter" title="Arrêter" onClick={() => { setStopError(""); setToStop(t); }}
                    className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Square className="h-4 w-4" /></button>
                </>
              )}
            />
          ))}
        </div>
      )}

      {modal && (
        <TreatmentFormModal treatment={modal.treatment} patients={patients.data ?? []} defaultPatientId={patientId}
          onClose={closeModal} onSaved={(msg) => { closeModal(); setNotice(msg); treatments.reload(); }} />
      )}
      {toStop && (
        <ConfirmDialog danger title="Arrêter ce traitement ?" confirmLabel="Arrêter le traitement" loading={stopping} error={stopError}
          message={`${toStop.medication_name} (${toStop.dosage}) sera marqué comme arrêté et ne pourra plus être modifié.`}
          onConfirm={stop} onClose={() => setToStop(null)} />
      )}
    </div>
  );
}
