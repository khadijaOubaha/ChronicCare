import { ArrowRight, Mail } from "lucide-react";
import { useState } from "react";
import { fakeLogin } from "../api";
import { useAuth } from "../auth";
import AuthLayout from "../components/AuthLayout";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PasswordField from "../components/ui/PasswordField";
import TextField from "../components/ui/TextField";

const FAKE = import.meta.env.MODE === "fakeauth";
const TABS = [
  { role: "PATIENT", label: "Patient" },
  { role: "ADMIN", label: "Médecin" },
];

export default function Login() {
  const { signIn } = useAuth();
  const [role, setRole] = useState("PATIENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) return setError("Saisissez une adresse e-mail valide.");
    setBusy(true);
    try {
      signIn(await fakeLogin(email.trim(), role));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-brand-900">Bon retour parmi nous</h2>
      <p className="mt-1 text-sm text-slate-500">Veuillez saisir vos identifiants pour accéder à votre compte.</p>

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

      <form onSubmit={submit} noValidate className="mt-6 space-y-4">
        {!FAKE && (
          <Alert>
            Le service d'authentification n'est pas encore branché. Lancez <code>npm run dev:fake</code> pour utiliser la connexion de test.
          </Alert>
        )}
        {error && <Alert>{error}</Alert>}
        <TextField
          label="Adresse e-mail"
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder={role === "ADMIN" ? "medecin@test.com" : "nom@exemple.fr"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField
          label="Mot de passe"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" loading={busy} disabled={!FAKE} className="w-full">
          Se connecter
          {!busy && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </Button>
        {FAKE && (
          <p className="text-xs leading-relaxed text-slate-500">
            Mode test : mot de passe libre. Médecins : <code>medecin@test.com</code>, <code>sarah.martin@test.com</code>,{" "}
            <code>jean.dupont@test.com</code>, <code>marie.lefevre@test.com</code>. Patient : <code>&lt;uuid&gt;@test.com</code> ou tout autre e-mail.
          </p>
        )}
      </form>
    </AuthLayout>
  );
}
