import { Activity, ArrowLeft, Calendar, Pill, Save, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import TextAreaField from "../components/ui/TextAreaField";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import { treatmentsApi } from "../api/treatmentsApi";
import { getErrorMessage } from "../utils/errors";

const DISEASE_OPTIONS = [
  { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
  { value: "HYPERTENSION", label: "Hypertension artérielle" },
];

export default function EditTreatmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    disease: "TYPE_2_DIABETES",
    medication_name: "",
    dosage: "",
    frequency: "",
    start_date: "",
    end_date: "",
    instructions: "",
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const [treatmentStatus, setTreatmentStatus] = useState("ACTIVE");

  useEffect(() => {
    treatmentsApi
      .get(id)
      .then((t) => {
        setTreatmentStatus(t.status);
        setFormData({
          disease: t.disease || "TYPE_2_DIABETES",
          medication_name: t.medication_name || "",
          dosage: t.dosage || "",
          frequency: t.frequency || "",
          start_date: t.start_date || "",
          end_date: t.end_date || "",
          instructions: t.instructions || "",
        });
      })
      .catch(setLoadError)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState error={loadError} onRetry={() => window.location.reload()} />;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const newErrors = {};
    if (!formData.medication_name.trim()) newErrors.medication_name = "Le nom du médicament est obligatoire.";
    if (!formData.dosage.trim()) newErrors.dosage = "Le dosage est obligatoire.";
    if (!formData.frequency.trim()) newErrors.frequency = "La fréquence est obligatoire.";
    if (!formData.start_date) newErrors.start_date = "La date de début est obligatoire.";

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "La date de fin doit être postérieure à la date de début.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        disease: formData.disease,
        medication_name: formData.medication_name.trim(),
        dosage: formData.dosage.trim(),
        frequency: formData.frequency.trim(),
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        instructions: formData.instructions.trim() || null,
      };
      await treatmentsApi.update(id, payload);
      navigate(`/prescriptions/${id}`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/prescriptions/${id}`}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          title="Retour aux détails"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={`Modifier la prescription — ${formData.medication_name}`}
          description="Ajustez les paramètres posologiques ou la durée de ce traitement."
        />
      </div>

      {serverError && <Alert>{serverError}</Alert>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Médicament & Pathologie
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Nom du médicament"
                icon={Pill}
                value={formData.medication_name}
                onChange={(e) => handleChange("medication_name", e.target.value)}
                error={errors.medication_name}
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
              Posologie & Administration
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Dosage"
                value={formData.dosage}
                onChange={(e) => handleChange("dosage", e.target.value)}
                error={errors.dosage}
                required
              />

              <TextField
                label="Fréquence"
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
                label="Date de fin (optionnel)"
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
              Instructions
            </h3>
            <div className="mt-4">
              <TextAreaField
                label="Consignes particulières"
                rows={3}
                value={formData.instructions}
                onChange={(e) => handleChange("instructions", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
            <Link to={`/prescriptions/${id}`}>
              <Button variant="secondary" type="button">
                Annuler
              </Button>
            </Link>
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" /> Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
