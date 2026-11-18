import { useState } from "react";
import { patientsApi } from "../../api/patientsApi";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import SelectField from "../../components/ui/SelectField";
import TextField from "../../components/ui/TextField";
import { getErrorMessage, getFieldErrors } from "../../utils/errors";
import { todayISO } from "../../utils/format";
import { validateEmail } from "../../utils/validators";

const SEXES = [{ value: "F", label: "Femme" }, { value: "M", label: "Homme" }, { value: "OTHER", label: "Autre" }];
const nn = (v) => v ?? "";

// patient fourni => modification (seuls les champs changés sont envoyés).
export default function PatientFormModal({ patient, onClose, onSaved }) {
  const editing = Boolean(patient);
  const [form, setForm] = useState({
    first_name: nn(patient?.first_name), last_name: nn(patient?.last_name),
    date_of_birth: nn(patient?.date_of_birth), sex: nn(patient?.sex),
    phone: nn(patient?.phone), email: nn(patient?.email), address: nn(patient?.address),
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const req = (v, label) => (!v.trim() ? `${label} obligatoire.` : v.trim().length > 100 ? "100 caractères maximum." : "");
    const e = {
      first_name: req(form.first_name, "Le prénom est"),
      last_name: req(form.last_name, "Le nom est"),
      date_of_birth: form.date_of_birth > todayISO() ? "La date ne peut pas être future." : "",
      email: form.email.trim() ? validateEmail(form.email) : "",
      phone: form.phone.length > 30 ? "30 caractères maximum." : "",
      address: form.address.length > 500 ? "500 caractères maximum." : "",
    };
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError("");
    if (!validate()) return;
    // Champs facultatifs vides => null (une chaîne vide serait refusée par le backend).
    const values = {
      first_name: form.first_name.trim(), last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth || null, sex: form.sex || null,
      phone: form.phone.trim() || null, email: form.email.trim() || null, address: form.address.trim() || null,
    };
    setSubmitting(true);
    try {
      if (editing) {
        const changes = Object.fromEntries(Object.entries(values).filter(([k, v]) => v !== (patient[k] ?? null)));
        if (Object.keys(changes).length) await patientsApi.update(patient.id, changes);
      } else {
        await patientsApi.create(values);
      }
      onSaved(editing ? "Patient modifié." : "Patient créé.");
    } catch (error) {
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editing ? "Modifier le patient" : "Nouveau patient"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Prénom" value={form.first_name} onChange={set("first_name")} error={errors.first_name} />
          <TextField label="Nom" value={form.last_name} onChange={set("last_name")} error={errors.last_name} />
          <TextField label="Date de naissance" type="date" value={form.date_of_birth}
            onChange={set("date_of_birth")} error={errors.date_of_birth} />
          <SelectField label="Sexe" placeholder="Non précisé" options={SEXES} value={form.sex}
            onChange={set("sex")} error={errors.sex} />
          <TextField label="Téléphone" type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} />
          <TextField label="E-mail" type="email" value={form.email} onChange={set("email")} error={errors.email} />
        </div>
        <TextField label="Adresse" value={form.address} onChange={set("address")} error={errors.address} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annuler</Button>
          <Button type="submit" loading={submitting}>{editing ? "Enregistrer" : "Créer le patient"}</Button>
        </div>
      </form>
    </Modal>
  );
}
