import {
  Activity,
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import TextAreaField from "../components/ui/TextAreaField";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import { patientsApi } from "../api/patientsApi";
import { fullName } from "../features/patients/patientUtils";
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

export default function EditPatientPage() {
  const { id } = useParams();
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
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    patientsApi
      .get(id)
      .then((p) => {
        setFormData({
          first_name: p.first_name || "",
          last_name: p.last_name || "",
          email: p.email || "",
          phone: p.phone || "",
          date_of_birth: p.date_of_birth || "",
          sex: p.sex || "M",
          disease: p.disease || "",
          address: p.address || "",
          is_active: Boolean(p.is_active),
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
    if (!formData.first_name.trim()) newErrors.first_name = "Le prénom est obligatoire.";
    if (!formData.last_name.trim()) newErrors.last_name = "Le nom est obligatoire.";
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;
    if (!formData.date_of_birth) newErrors.date_of_birth = "La date de naissance est obligatoire.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
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
        is_active: formData.is_active,
      };
      await patientsApi.update(id, payload);
      navigate(`/patients/${id}`);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await patientsApi.remove(id);
      navigate("/patients");
    } catch (err) {
      setServerError(getErrorMessage(err));
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/patients/${id}`}
          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          title="Retour au profil"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader
          title={`Modifier ${formData.first_name} ${formData.last_name}`}
          description="Mettez à jour les coordonnées et informations médicales de ce patient."
        />
      </div>

      {serverError && <Alert>{serverError}</Alert>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Identité
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Prénom"
                icon={User}
                value={formData.first_name}
                onChange={(e) => handleChange("first_name", e.target.value)}
                error={errors.first_name}
                required
              />

              <TextField
                label="Nom de famille"
                icon={User}
                value={formData.last_name}
                onChange={(e) => handleChange("last_name", e.target.value)}
                error={errors.last_name}
                required
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Coordonnées
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField
                label="Adresse e-mail"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                error={errors.email}
                required
              />

              <TextField
                label="Numéro de téléphone"
                icon={Phone}
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Données médicales
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
              Adresse postale
            </h3>
            <div className="mt-4">
              <TextAreaField
                label="Adresse"
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
          </div>

          {/* Statut du patient */}
          <div className="rounded-lg bg-slate-50 p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleChange("is_active", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <div>
                <span className="text-sm font-semibold text-slate-800">
                  Dossier patient actif
                </span>
                <p className="text-xs text-slate-500">
                  Si décoché, le patient est considéré inactif et ne pourra pas recevoir de
                  nouvelles prescriptions.
                </p>
              </div>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="h-4 w-4" /> Supprimer ce patient
            </Button>

            <div className="flex items-center gap-3">
              <Link to={`/patients/${id}`}>
                <Button variant="secondary" type="button">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" /> Enregistrer les modifications
              </Button>
            </div>
          </div>
        </form>
      </div>

      {showDeleteModal && (
        <Modal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          title="Confirmer la suppression"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Êtes-vous sûr de vouloir supprimer définitivement le dossier de{" "}
              <strong>{formData.first_name} {formData.last_name}</strong> ? Cette action est
              irréversible.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>
                Confirmer la suppression
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
