import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PasswordField from "../components/ui/PasswordField";
import TextField from "../components/ui/TextField";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../auth/roles";
import AuthLayout from "../layouts/AuthLayout";
import { getErrorMessage } from "../utils/errors";
import { validateEmail } from "../utils/validators";

const TABS = [
  { role: ROLES.PATIENT, label: "Patient" },
  { role: ROLES.DOCTOR, label: "Médecin" },
];

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registeredEmail = location.state?.registered ? location.state.email : null;

  const [role, setRole] = useState(ROLES.PATIENT);
  const [email, setEmail] = useState(registeredEmail || "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = {
      email: validateEmail(email),
      password: password ? "" : "Le mot de passe est obligatoire.",
    };
    setErrors(next);
    setFormError("");
    if (next.email || next.password) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password, remember, expectedRole: role });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-brand-900">Bon retour parmi nous</h2>
      <p className="mt-1 text-sm text-slate-500">
        Veuillez saisir vos identifiants pour accéder à votre compte.
      </p>

      <div role="tablist" aria-label="Type de compte" className="mt-6 grid grid-cols-2 rounded-lg bg-slate-200/70 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.role}
            type="button"
            role="tab"
            aria-selected={role === tab.role}
            onClick={() => setRole(tab.role)}
            className={`h-9 rounded-md text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 ${
              role === tab.role ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        {registeredEmail && !formError && (
          <Alert type="success">Compte créé. Vous pouvez maintenant vous connecter.</Alert>
        )}
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Adresse e-mail"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="nom@exemple.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PasswordField
          label="Mot de passe"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelAside={
            // Pas d'endpoint de réinitialisation dans le service Auth : lien inactif.
            <span
              aria-disabled="true"
              title="Bientôt disponible"
              className="cursor-not-allowed text-xs font-semibold text-slate-400"
            >
              Mot de passe oublié ?
            </span>
          }
        />

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Se souvenir de moi
        </label>

        <Button type="submit" loading={submitting} className="w-full">
          Se connecter
          {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Vous n'avez pas encore de compte ?{" "}
        <Link to="/register" className="font-semibold text-brand-900 hover:underline">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}
