import { Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PasswordField from "../components/ui/PasswordField";
import TextField from "../components/ui/TextField";
import AuthLayout from "../layouts/AuthLayout";
import { getErrorMessage, getFieldErrors } from "../utils/errors";
import { validateEmail, validateFullName, validateNewPassword } from "../utils/validators";

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {
      full_name: validateFullName(form.full_name),
      email: validateEmail(form.email),
      password: validateNewPassword(form.password),
      confirm: form.confirm === form.password ? "" : "Les mots de passe ne correspondent pas.",
    };
    setErrors(next);
    setFormError("");
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      const email = form.email.trim();
      await authApi.register({ full_name: form.full_name.trim(), email, password: form.password });
      navigate("/login", { replace: true, state: { registered: true, email } });
    } catch (error) {
      const status = error.response?.status;
      if (status === 409) setErrors({ email: getErrorMessage(error) });
      else if (status === 422) {
        setErrors(getFieldErrors(error));
        setFormError(getErrorMessage(error));
      } else setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-brand-900">Créer un compte patient</h2>
      <p className="mt-1 text-sm text-slate-500">
        Renseignez vos informations pour accéder à votre espace de suivi.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Nom complet"
          icon={User}
          autoComplete="name"
          placeholder="Prénom Nom"
          value={form.full_name}
          onChange={set("full_name")}
          error={errors.full_name}
        />
        <TextField
          label="Adresse e-mail"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="nom@exemple.fr"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <PasswordField
          label="Mot de passe"
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
        />
        <PasswordField
          label="Confirmer le mot de passe"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
        />

        <Button type="submit" loading={submitting} className="w-full">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Vous avez déjà un compte ?{" "}
        <Link to="/login" className="font-semibold text-brand-900 hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
