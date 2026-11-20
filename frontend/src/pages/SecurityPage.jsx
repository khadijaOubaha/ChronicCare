import { CheckCircle2, Clock, KeyRound, Laptop, Lock, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import PasswordField from "../components/ui/PasswordField";
import { authApi } from "../api/authApi";
import { getErrorMessage } from "../utils/errors";
import { validatePassword } from "../utils/validators";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [apiError, setApiError] = useState("");

  const [secInfo, setSecInfo] = useState(null);

  useEffect(() => {
    authApi
      .securityInfo()
      .then(setSecInfo)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNotice("");
    setApiError("");

    const newErrors = {};
    if (!currentPassword) newErrors.current_password = "Le mot de passe actuel est requis.";
    const passErr = validatePassword(newPassword);
    if (passErr) newErrors.new_password = passErr;
    if (newPassword && confirmPassword !== newPassword) {
      newErrors.confirm_password = "Les mots de passe ne correspondent pas.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setNotice("Votre mot de passe a été modifié avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sécurité du compte"
        description="Gérez vos paramètres d'authentification et consultez l'état de sécurité de votre session."
      />

      {notice && <Alert type="success">{notice}</Alert>}
      {apiError && <Alert>{apiError}</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire Changement de Mot de Passe */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">
                  Modifier le mot de passe
                </h3>
                <p className="text-xs text-slate-500">
                  Choisissez un mot de passe robuste d'au moins 8 caractères.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <PasswordField
                label="Mot de passe actuel"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrors((p) => ({ ...p, current_password: "" }));
                }}
                error={errors.current_password}
                required
              />

              <PasswordField
                label="Nouveau mot de passe"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors((p) => ({ ...p, new_password: "" }));
                }}
                error={errors.new_password}
                required
              />

              <PasswordField
                label="Confirmer le nouveau mot de passe"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((p) => ({ ...p, confirm_password: "" }));
                }}
                error={errors.confirm_password}
                required
              />

              <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Règles de sécurité :</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5">
                  <li>Au moins 8 caractères</li>
                  <li>Au moins une lettre majuscule et une minuscule</li>
                  <li>Au moins un chiffre</li>
                  <li>Différent du mot de passe actuel</li>
                </ul>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={submitting}>
                  <Lock className="h-4 w-4" /> Mettre à jour le mot de passe
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Informations de Sécurité */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              État de la session
            </h4>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Statut de session</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Durée du jeton</span>
                <span className="font-medium text-slate-800">
                  {secInfo?.session_expires_in_minutes ?? 30} minutes
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Chiffrement</span>
                <span className="font-medium text-slate-800">
                  {secInfo?.encryption_standard ?? "JWT (HS256)"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Laptop className="h-4 w-4 text-brand-600" />
              Appareil & Connexion
            </h4>
            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Navigateur</span>
                <span className="font-medium text-slate-800">Navigateur Web</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Dernière activité</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                  <Clock className="h-3.5 w-3.5 text-slate-400" /> En cours
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
