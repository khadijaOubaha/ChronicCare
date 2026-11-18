import { useState } from "react";
import { treatmentsApi } from "../../api/treatmentsApi";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SelectField from "../../components/ui/SelectField";
import TextAreaField from "../../components/ui/TextAreaField";
import TextField from "../../components/ui/TextField";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { DISEASE_LABELS, fullName, todayISO } from "../../utils/format";

const DISEASES = Object.entries(DISEASE_LABELS).map(([value, label]) => ({ value, label }));
const SUGGESTIONS = ["Metformine", "Lisinopril", "Atorvastatine", "Aspirine Cardio", "Valsartan"];

// treatment fourni => modification (seuls les champs changés sont envoyés).
export default function TreatmentFormModal({ treatment, patients = [], defaultPatientId = "", onClose, onSaved }) {
  const editing = Boolean(treatment);
  const [form, setForm] = useState({
    patient_id: treatment?.patient_id ?? defaultPatientId,
    disease: treatment?.disease ?? "",
    medication_name: treatment?.medication_name ?? "",
    dosage: treatment?.dosage ?? "",
    frequency: treatment?.frequency ?? "",
    start_date: treatment?.start_date ?? todayISO(),
    end_date: treatment?.end_date ?? "",
    instructions: treatment?.instructions ?? "",
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const required = (v, max, msg) => (!v.trim() ? msg : v.trim().length > max ? `${max} caractères maximum.` : "");

  const validate = () => {
    const e = {
      patient_id: !editing && !form.patient_id ? "Choisissez un patient." : "",
      disease: form.disease ? "" : "Choisissez une pathologie.",
      medication_name: required(form.medication_name, 200, "Le médicament est obligatoire."),
      dosage: required(form.dosage, 100, "Le dosage est obligatoire."),
      frequency: required(form.frequency, 200, "La fréquence est obligatoire."),
      start_date: form.start_date ? "" : "La date de début est obligatoire.",
      end_date:
        form.end_date && form.end_date < form.start_date ? "La fin doit être postérieure ou égale au début." : "",
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError("");
    if (!validate()) return;
    const values = {
      disease: form.disease,
      medication_name: form.medication_name.trim(),
      dosage: form.dosage.trim(),
      frequency: form.frequency.trim(),
      start_date: form.start_date,
      end_date: form.end_date || null,
      instructions: form.instructions.trim() || null,
    };
    setSubmitting(true);
    try {
      if (editing) {
        const changes = Object.fromEntries(
          Object.entries(values).filter(([k, v]) => v !== (treatment[k] ?? null))
        );
        if (Object.keys(changes).length) await treatmentsApi.update(treatment.id, changes);
      } else {
        await treatmentsApi.create({ patient_id: form.patient_id, ...values });
      }
      onSaved(editing ? "Prescription modifiée." : "Prescription créée.");
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const patientOptions = patients
    .filter((p) => p.is_active)
    .map((p) => ({ value: p.id, label: fullName(p) }));

  return (
    <Modal
      title={editing ? "Modifier la prescription" : "Créer une prescription"}
      description={editing ? undefined : "Renseignez les détails pour générer une nouvelle ordonnance."}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        {!editing && (
          <SelectField label="Patient" placeholder="Sélectionner un patient" options={patientOptions}
            value={form.patient_id} onChange={set("patient_id")} error={errors.patient_id} />
        )}
        <SelectField label="Pathologie" placeholder="Sélectionner" options={DISEASES}
          value={form.disease} onChange={set("disease")} error={errors.disease} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Médicament" list="med-suggestions" value={form.medication_name}
            onChange={set("medication_name")} error={errors.medication_name} />
          <TextField label="Dosage" placeholder="ex: 500mg" value={form.dosage}
            onChange={set("dosage")} error={errors.dosage} />
        </div>
        <datalist id="med-suggestions">{SUGGESTIONS.map((s) => <option key={s} value={s} />)}</datalist>
        <TextField label="Fréquence" placeholder="ex: 2x par jour" value={form.frequency}
          onChange={set("frequency")} error={errors.frequency} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Date de début" type="date" value={form.start_date}
            onChange={set("start_date")} error={errors.start_date} />
          <TextField label="Date de fin (facultatif)" type="date" value={form.end_date}
            onChange={set("end_date")} error={errors.end_date} />
        </div>
        <TextAreaField label="Instructions complémentaires" placeholder="Précisez les modalités de prise…"
          value={form.instructions} onChange={set("instructions")} error={errors.instructions} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>{editing ? "Enregistrer" : "Valider la prescription"}</Button>
        </div>
      </form>
    </Modal>
  );
}
