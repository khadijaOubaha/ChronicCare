import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import TextField from "../components/ui/TextField";
import AuthLayout from "../layouts/AuthLayout";
import { authApi } from "../api/authApi";
import { getErrorMessage } from "../utils/errors";
import { validateEmail } from "../utils/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    setError(emailErr);
    setApiError("");
    if (emailErr) return;

    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Entrez votre adresse email pour recevoir un lien de réinitialisation."
    >
      {submitted ? (
        <div className="mt-6 space-y-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Demande envoyée !</h3>
            <p className="mt-1 text-sm text-slate-600">
              Si cette adresse correspond à un compte actif, des instructions pour réinitialiser
              votre mot de passe vous ont été envoyées.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" /> Retour à la connexion
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
          {apiError && <Alert>{apiError}</Alert>}

          <TextField
            label="Adresse e-mail"
            icon={Mail}
            type="email"
            autoComplete="email"
            placeholder="nom@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />

          <Button type="submit" loading={submitting} className="w-full">
            Envoyer le lien de réinitialisation
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Retour à la connexion
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
