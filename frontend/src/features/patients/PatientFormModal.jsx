
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

const SEXES = [
  { value: "F", label: "Femme" },
  { value: "M", label: "Homme" },
  { value: "OTHER", label: "Autre" },
];

const DISEASES = [
  { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
  { value: "HYPERTENSION", label: "Hypertension" },
];

const nn = (value) => value ?? "";

export default function PatientFormModal({ patient, onClose, onSaved }) {
  const editing = Boolean(patient);

  const [form, setForm] = useState({
    first_name: nn(patient?.first_name),
    last_name: nn(patient?.last_name),
    date_of_birth: nn(patient?.date_of_birth),
    sex: nn(patient?.sex),
    phone: nn(patient?.phone),
    email: nn(patient?.email),
    password: "",
    address: nn(patient?.address),
    disease: nn(patient?.disease),
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (event) =>
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));

  const validate = () => {
    const required = (value, label) =>
      !value.trim() ? `${label} obligatoire.` : "";

    const validationErrors = {
      first_name: required(form.first_name, "Le prénom est"),
      last_name: required(form.last_name, "Le nom est"),
      date_of_birth:
        form.date_of_birth > todayISO()
          ? "La date ne peut pas être future."
          : "",
      email: editing
        ? ""
        : form.email.trim()
          ? validateEmail(form.email)
          : "L'e-mail est obligatoire.",
      password:
        !editing && form.password.length < 8
          ? "Le mot de passe doit contenir au moins 8 caractères."
          : "",
      disease: !editing && !form.disease
        ? "La pathologie est obligatoire."
        : "",
      phone:
        form.phone.length > 30
          ? "30 caractères maximum."
          : "",
      address:
        form.address.length > 500
          ? "500 caractères maximum."
          : "",
    };

    setErrors(validationErrors);
    return !Object.values(validationErrors).some(Boolean);
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError("");

    if (!validate()) return;

    const values = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      date_of_birth: form.date_of_birth || null,
      sex: form.sex || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      disease: form.disease || null,
    };

    setSubmitting(true);

    try {
      if (editing) {
        const changes = Object.fromEntries(
          Object.entries(values).filter(
            ([key, value]) => value !== (patient[key] ?? null)
          )
        );

        if (Object.keys(changes).length) {
          await patientsApi.update(patient.id, changes);
        }
      } else {
        await patientsApi.create({
          ...values,
          email: form.email.trim().toLowerCase(),
          password: form.password,
        });
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
    <Modal
      title={editing ? "Modifier le patient" : "Nouveau patient"}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && <Alert>{formError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Prénom"
            value={form.first_name}
            onChange={set("first_name")}
            error={errors.first_name}
          />

          <TextField
            label="Nom"
            value={form.last_name}
            onChange={set("last_name")}
            error={errors.last_name}
          />

          <TextField
            label="Date de naissance"
            type="date"
            value={form.date_of_birth}
            onChange={set("date_of_birth")}
            error={errors.date_of_birth}
          />

          <SelectField
            label="Sexe"
            placeholder="Non précisé"
            options={SEXES}
            value={form.sex}
            onChange={set("sex")}
            error={errors.sex}
          />

          <TextField
            label="Téléphone"
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
          />

          <SelectField
            label="Pathologie"
            placeholder="Choisir une pathologie"
            options={DISEASES}
            value={form.disease}
            onChange={set("disease")}
            error={errors.disease}
          />

          <TextField
            label="E-mail"
            type="email"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            disabled={editing}
          />

          {!editing && (
            <TextField
              label="Mot de passe initial"
              type="password"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
            />
          )}
        </div>

        <TextField
          label="Adresse"
          value={form.address}
          onChange={set("address")}
          error={errors.address}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>

          <Button type="submit" loading={submitting}>
            {editing ? "Enregistrer" : "Créer le patient"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
