import { ArrowLeft, Save, User, Mail, Phone, Calendar, MapPin, Activity } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import TextAreaField from "../components/ui/TextAreaField";
import { patientsApi } from "../api/patientsApi";
import { getErrorMessage } from "../utils/errors";
import { validateEmail } from "../utils/validators";

const SEX_OPTIONS = [
  { value: "M", label: "Masculin (M)" },
  { value: "F", label: "Féminin (F)" },
];

const DISEASE_OPTIONS = [
  { value: "", label: "Sélectionner une pathologie (optionnel)" },
  { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
  { value: "HYPERTENSION", label: "Hypertension artérielle" },
];

export default function AddPatientPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    sex: "M",
    disease: "",
    address: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "Le prénom est obligatoire.";
    if (!formData.last_name.trim()) newErrors.last_name = "Le nom est obligatoire.";
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;
    if (!formData.date_of_birth) newErrors.date_of_birth = "La date de naissance est obligatoire.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        date_of_birth: formData.date_of_birth,
        sex: formData.sex,
        disease: formData.disease || null,
        address: formData.address.trim() || null,
      };
      const created = await patientsApi.create(payload);
      navigate(`/patients/${created.id}`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/patients"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          title="Retour aux patients"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title="Nouveau patient"
          description="Créer un nouveau dossier patient dans la plateforme ChronicCare."
        />
      </div>

      {serverError && <Alert>{serverError}</Alert>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              État civil & Identité
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Prénom"
                icon={User}
                placeholder="Ex. Jean"
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                error={errors.first_name}
                required
              />

              <TextField
                label="Nom de famille"
                icon={User}
                placeholder="Ex. Dupont"
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                error={errors.last_name}
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Coordonnées de contact
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Adresse e-mail"
                icon={Mail}
                type="email"
                placeholder="jean.dupont@exemple.fr"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
                required
              />

              <TextField
                label="Numéro de téléphone"
                icon={Phone}
                type="tel"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Données médicales & Personnelles
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextField
                label="Date de naissance"
                icon={Calendar}
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
                error={errors.date_of_birth}
                required
              />

              <SelectField
                label="Sexe"
                value={formData.sex}
                onChange={(e) => handleChange("sex", e.target.value)}
                options={SEX_OPTIONS}
                required
              />

              <SelectField
                label="Pathologie suivie"
                icon={Activity}
                value={formData.disease}
                onChange={(e) => handleChange("disease", e.target.value)}
                options={DISEASE_OPTIONS}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Adresse
            </h3>
            <div className="mt-4">
              <TextAreaField
                label="Adresse postale"
                rows={2}
                placeholder="Ex. 14 rue Victor Hugo, 69002 Lyon"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <Link to="/patients">
              <Button variant="secondary" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              <Save className="h-4 w-4" /> Créer le patient
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
