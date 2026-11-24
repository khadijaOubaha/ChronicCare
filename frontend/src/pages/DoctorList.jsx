import { Ban, Check, Pencil, Plus, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { teleconsultationsApi } from "../api/teleconsultationsApi";
import { patientsApi } from "../api/patientsApi";
import { getErrorMessage } from "../utils/errors";
import { useAuth } from "../auth/AuthContext";
import { tokenStorage } from "../auth/tokenStorage";
import { IconButton, JoinButton, TeleRow, Toast } from "../components/Common";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextAreaField from "../components/ui/TextAreaField";
import TextField from "../components/ui/TextField";
import Tabs from "../components/ui/Tabs";
import { EmptyState, LoadingState } from "../components/ui/StateViews";
import { isAutoLink, isoToLocalInput, localInputToIso, parseUtc, useNow } from "../lib/tele";

const TABS = [
  ["REQUESTED", "Demandes"],
  ["SCHEDULED", "À venir"],
  ["COMPLETED", "Terminées"],
  ["CANCELLED", "Annulées"],
];

/** Formulaire unique : mode = create | confirm | edit | notes. */
function ConsultModal({ mode, item, patients, onClose, onSubmit }) {
  const [patientId, setPatientId] = useState(item?.patient_id || patients[0]?.id || "");
  const [when, setWhen] = useState(isoToLocalInput(item?.scheduled_at));
  const [link, setLink] = useState(item?.meeting_link || "");
  const [notes, setNotes] = useState(item?.notes || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const titles = {
    create: "Planifier une téléconsultation",
    confirm: "Confirmer la demande",
    edit: "Modifier la téléconsultation",
    notes: "Compte rendu",
  };
  const showDate = mode !== "notes";
  const showLink = mode !== "notes";

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (mode === "create" && !/^[0-9a-f-]{36}$/i.test(patientId.trim())) return setError("Choisissez ou saisissez l'UUID du patient.");
    if (showDate && !when) return setError("Choisissez la date et l'heure.");
    setBusy(true);
    try {
      await onSubmit({
        patient_id: patientId.trim(),
        scheduled_at: localInputToIso(when),
        meeting_link: link.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={titles[mode]} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {mode === "create" &&
          (patients.length > 0 ? (
            <SelectField
              label="Patient"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              options={patients.map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name}` }))}
            />
          ) : (
            <TextField label="Patient" value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="UUID du patient" />
          ))}
        {showDate && <TextField label="Date et heure" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />}
        {showLink && (
          <div>
            <TextField label="Lien de la salle (facultatif)" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://meet.example.com/salle-1" />
            <p className="mt-1 text-xs text-slate-500">Laissé vide, un lien Jitsi est généré automatiquement.</p>
          </div>
        )}
        <TextAreaField label={mode === "notes" ? "Notes / compte rendu" : "Notes"} maxLength={2000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Fermer</Button>
          <Button type="submit" loading={busy}>
            {busy ? "Enregistrement…" : mode === "confirm" ? "Confirmer" : mode === "create" ? "Planifier" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function DoctorList() {
  const { user } = useAuth();
  const token = tokenStorage.get();
  const now = useNow();
  const [items, setItems] = useState(null);
  const [patients, setPatients] = useState([]);
  const [tab, setTab] = useState("SCHEDULED");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = (text, type = "ok") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(() => {
    teleconsultationsApi
      .list({ doctor_id: user.id })
      .then((data) => setItems(data.items))
      .catch((e) => notify(getErrorMessage(e), "err"));
  }, [token, user.id]);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    patientsApi
      .list({ limit: 100 })
      .then((data) => setPatients(Array.isArray(data) ? data : (data?.items ?? []))).catch(() => setPatients([]));
  }, [token]);

  const nameOf = useCallback(
    (id) => {
      const p = patients.find((x) => x.id === id);
      return p ? `${p.first_name} ${p.last_name}` : `Patient #${id.slice(0, 8)}`;
    },
    [patients],
  );

  const grouped = useMemo(() => {
    const out = { REQUESTED: [], SCHEDULED: [], COMPLETED: [], CANCELLED: [] };
    (items || []).forEach((t) => out[t.status]?.push(t));
    out.COMPLETED.reverse();
    out.CANCELLED.reverse();
    return out;
  }, [items]);

  async function run(promise, okText) {
    try {
      await promise;
      notify(okText);
      load();
      return true;
    } catch (e) {
      notify(getErrorMessage(e), "err");
      return false;
    }
  }

  async function submitModal(values) {
    const { mode, item } = modal;
    let promise;
    let okText;
    if (mode === "create") {
      promise = teleconsultationsApi.create({
        patient_id: values.patient_id,
        doctor_id: user.id,
        scheduled_at: values.scheduled_at,
        meeting_link: values.meeting_link,
        notes: values.notes,
      });
      okText = "Téléconsultation planifiée.";
    } else if (mode === "confirm") {
      promise = teleconsultationsApi.confirm(item.id, {
        scheduled_at: values.scheduled_at,
        meeting_link: values.meeting_link,
        notes: values.notes,
      });
      okText = "Demande confirmée.";
    } else if (mode === "edit") {
      promise = teleconsultationsApi.update(item.id, {
        scheduled_at: values.scheduled_at,
        meeting_link: values.meeting_link,
        notes: values.notes,
      });
      okText = "Téléconsultation modifiée.";
    } else {
      promise = teleconsultationsApi.update(item.id, { notes: values.notes });
      okText = "Compte rendu enregistré.";
    }
    await promise; // en cas d'erreur, le formulaire l'affiche
    notify(okText);
    setModal(null);
    load();
  }

  const setStatus = (t, status, question, okText) =>
    window.confirm(question) && run(teleconsultationsApi.setStatus(t.id, status), okText);

  function actions(t) {
    return (
      <>
        <JoinButton t={t} now={now} label="Rejoindre" />
        {t.status === "REQUESTED" && (
          <>
            <IconButton tone="ok" title="Confirmer" onClick={() => setModal({ mode: "confirm", item: t })}>
              <Check className="h-4 w-4" />
            </IconButton>
            <IconButton
              tone="bad"
              title="Refuser"
              onClick={() => setStatus(t, "CANCELLED", "Refuser cette demande ?", "Demande refusée.")}
            >
              <Ban className="h-4 w-4" />
            </IconButton>
          </>
        )}
        {t.status === "SCHEDULED" && (
          <>
            <IconButton title="Modifier" onClick={() => setModal({ mode: "edit", item: t })}>
              <Pencil className="h-4 w-4" />
            </IconButton>
            <IconButton
              tone="ok"
              title="Terminer"
              onClick={() => setStatus(t, "COMPLETED", "Marquer cette téléconsultation comme terminée ?", "Téléconsultation terminée.")}
            >
              <Check className="h-4 w-4" />
            </IconButton>
            <IconButton
              tone="bad"
              title="Annuler"
              onClick={() => setStatus(t, "CANCELLED", "Annuler cette téléconsultation ?", "Téléconsultation annulée.")}
            >
              <X className="h-4 w-4" />
            </IconButton>
          </>
        )}
        {t.status === "COMPLETED" && (
          <IconButton title="Compte rendu" onClick={() => setModal({ mode: "notes", item: t })}>
            <Pencil className="h-4 w-4" />
          </IconButton>
        )}
      </>
    );
  }

  const shown = grouped[tab];
  const sorted = [...shown].sort((a, b) => (parseUtc(a.scheduled_at) || 0) - (parseUtc(b.scheduled_at) || 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Téléconsultations"
        description="Demandes des patients et consultations planifiées."
        actions={
          <Button type="button" onClick={() => setModal({ mode: "create" })}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Planifier
          </Button>
        }
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={TABS.map(([id, label]) => ({
          id,
          label: (
            <>
              {label} <span className="ml-1 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{grouped[id].length}</span>
            </>
          ),
        }))}
      />

      <div className="space-y-3">
        {items === null && <LoadingState />}
        {items !== null && sorted.length === 0 && <EmptyState title="Aucune téléconsultation dans cet onglet." />}
        {sorted.map((t) => (
          <TeleRow
            key={t.id}
            t={t}
            now={now}
            who={{ name: nameOf(t.patient_id), sub: t.status === "SCHEDULED" && isAutoLink(t) ? "Salle automatique" : "Patient" }}
            detailsTo={`/teleconsultations/${t.id}`}
            actions={actions(t)}
          />
        ))}
      </div>

      {modal && (
        <ConsultModal mode={modal.mode} item={modal.item} patients={patients} onClose={() => setModal(null)} onSubmit={submitModal} />
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
