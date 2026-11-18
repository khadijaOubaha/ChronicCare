import { Check, Mail, MapPin, Phone, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import SelectField from "../components/ui/SelectField";
import TextField from "../components/ui/TextField";
import TextAreaField from "../components/ui/TextAreaField";
import { useAuth } from "../auth/AuthContext";
import { ROLE_LABELS, ROLES } from "../auth/roles";
import { authApi } from "../api/authApi";
import { getErrorMessage } from "../utils/errors";
import { validateEmail } from "../utils/validators";

const DISEASE_OPTIONS = [
  { value: "", label: "Aucune / Non spécifiée" },
  { value: "TYPE_2_DIABETES", label: "Diabète de type 2" },
  { value: "HYPERTENSION", label: "Hypertension artérielle" },
];

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    address: "",
    disease: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone: user.phone || "",
        date_of_birth: user.date_of_birth || "",
        address: user.address || "",
        disease: user.disease || "",
      });
    }
  }, [user]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    setServerError("");

    const newErrors = {};
    if (!formData.full_name.trim()) newErrors.full_name = "Le nom complet est obligatoire.";
    const emailErr = validateEmail(formData.email);
    if (emailErr) newErrors.email = emailErr;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address.trim() || null,
      };
      if (user.role === ROLES.PATIENT) {
        payload.disease = formData.disease || null;
      }
      await authApi.updateProfile(payload);
      await refreshUser();
      setNotice("Profil mis à jour avec succès.");
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.full_name || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mon profil"
        description="Consultez et modifiez vos informations personnelles."
      />

      {notice && <Alert type="success">{notice}</Alert>}
      {serverError && <Alert>{serverError}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Carte Résumé Profil */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-900 text-2xl font-bold text-white shadow-inner">
              {initials}
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800">{user?.full_name}</h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="mt-3">
              <Badge variant={user?.role === ROLES.DOCTOR ? "brand" : "neutral"}>
                {ROLE_LABELS[user?.role] || user?.role}
              </Badge>
            </div>
          </div>

          <hr className="my-6 border-slate-100" />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Shield className="h-4 w-4 text-brand-600" />
              <span>Rôle : <strong>{ROLE_LABELS[user?.role] || user?.role}</strong></span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3 text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{user.phone}</span>
              </div>
            )}
            {user?.address && (
              <div className="flex items-center gap-3 text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{user.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Formulaire Modification */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">Informations personnelles</h3>
            <p className="mt-1 text-sm text-slate-500">
              Mettez à jour vos coordonnées et détails de contact.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nom complet"
                  icon={User}
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  error={errors.full_name}
                  required
                />

                <TextField
                  label="Adresse e-mail"
                  icon={Mail}
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  error={errors.email}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Numéro de téléphone"
                  icon={Phone}
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />

                <TextField
                  label="Date de naissance"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => handleChange("date_of_birth", e.target.value)}
                />
              </div>

              {user?.role === ROLES.PATIENT && (
                <SelectField
                  label="Pathologie principale suivie"
                  value={formData.disease}
                  onChange={(e) => handleChange("disease", e.target.value)}
                  options={DISEASE_OPTIONS}
                />
              )}

              <TextAreaField
                label="Adresse postale"
                rows={3}
                placeholder="Ex. 12 rue de la Paix, 75001 Paris"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={saving}>
                  <Check className="h-4 w-4" /> Enregistrer les modifications
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
