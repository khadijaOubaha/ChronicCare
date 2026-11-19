import { Activity, ArrowLeft, Calendar, FileText, Pill, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import TextAreaField from "../components/ui/TextAreaField";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import { fullName } from "../features/patients/patientUtils";
import { getErrorMessage } from "../utils/errors";

const DISEASE_OPTIONS = [
  { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
  { value: "HYPERTENSION", label: "Hypertension artérielle" },
];

export default function AddTreatmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get("patient") || "";

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const [formData, setFormData] = useState({
    patient_id: preselectedPatientId,
    disease: "TYPE_2_DIABETES",
    medication_name: "",
    dosage: "",
    frequency: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    instructions: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    patientsApi
      .list({ limit: 100 })
      .then((res) => {
        const list = res.items || (Array.isArray(res) ? res : []);
        setPatients(list);
        if (preselectedPatientId) {
          const match = list.find((p) => p.id === preselectedPatientId);
          if (match && match.disease) {
            setFormData((prev) => ({ ...prev, disease: match.disease }));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPatients(false));
  }, [preselectedPatientId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));

    if (field === "patient_id") {
      const match = patients.find((p) => p.id === value);
      if (match && match.disease) {
        setFormData((prev) => ({ ...prev, disease: match.disease }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = {};
    if (!formData.patient_id) newErrors.patient_id = "Veuillez sélectionner un patient.";
    if (!formData.disease) newErrors.disease = "La pathologie est obligatoire.";
    if (!formData.medication_name.trim()) newErrors.medication_name = "Le nom du médicament est obligatoire.";
    if (!formData.dosage.trim()) newErrors.dosage = "Le dosage est obligatoire.";
    if (!formData.frequency.trim()) newErrors.frequency = "La fréquence de prise est obligatoire.";
    if (!formData.start_date) newErrors.start_date = "La date de début est obligatoire.";

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "La date de fin doit être postérieure à la date de début.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        patient_id: formData.patient_id,
        disease: formData.disease,
        medication_name: formData.medication_name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        instructions: formData.instructions.trim() || null,
      };
      const created = await treatmentsApi.create(payload);
      navigate(`/prescriptions/${created.id}`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const patientOptions = [
    { value: "", label: "Sélectionnez un patient..." },
    ...patients.map((p) => ({
      value: p.id,
      label: `${fullName(p)} (${p.email})`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/prescriptions"
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          title="Retour aux prescriptions"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title="Nouvelle prescription"
          description="Prescrire un traitement médical à un patient suivi dans ChronicCare."
        />
      </div>

      {serverError && <Alert>{serverError}</Alert>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Bénéficiaire & Pathologie
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Patient"
                value={formData.patient_id}
                onChange={(e) => handleChange("patient_id", e.target.value)}
                options={patientOptions}
                error={errors.patient_id}
                disabled={loadingPatients}
                required
              />

              <SelectField
                label="Pathologie ciblée"
                icon={Activity}
                value={formData.disease}
                onChange={(e) => handleChange("disease", e.target.value)}
                options={DISEASE_OPTIONS}
                error={errors.disease}
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Médicament & Posologie
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <TextField
                label="Nom du médicament"
                icon={Pill}
                placeholder="Ex. Metformine"
                value={formData.medication_name}
                onChange={(e) => handleChange("medication_name", e.target.value)}
                error={errors.medication_name}
                required
              />

              <TextField
                label="Dosage"
                placeholder="Ex. 500 mg ou 1 comprimé"
                value={formData.dosage}
                onChange={(e) => handleChange("dosage", e.target.value)}
                error={errors.dosage}
                required
              />

              <TextField
                label="Fréquence"
                placeholder="Ex. 2 fois par jour"
                value={formData.frequency}
                onChange={(e) => handleChange("frequency", e.target.value)}
                error={errors.frequency}
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Durée du traitement
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Date de début"
                icon={Calendar}
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                error={errors.start_date}
                required
              />

              <TextField
                label="Date de fin (laisser vide si traitement continu)"
                icon={Calendar}
                type="date"
                value={formData.end_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                error={errors.end_date}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Consignes & Conseils de prise
            </h3>
            <div className="mt-4">
              <TextAreaField
                label="Instructions spécifiques"
                rows={3}
                placeholder="Ex. À prendre au cours du repas du soir avec un grand verre d'eau."
                value={formData.instructions}
                onChange={(e) => handleChange("instructions", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <Link to="/prescriptions">
              <Button variant="secondary" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              <Save className="h-4 w-4" /> Enregistrer la prescription
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
