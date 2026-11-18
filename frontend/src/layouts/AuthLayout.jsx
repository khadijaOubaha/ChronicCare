import { ShieldCheck, Stethoscope, CircleCheck, HeartPulse, UserCheck } from "lucide-react";
import Logo from "../components/ui/Logo";
import { ROLES } from "../auth/roles";

// Images haute qualité (médecin et patient)
const BACKGROUND_IMAGES = {
  [ROLES.DOCTOR]:
    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1600&q=80",
  [ROLES.PATIENT]:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
};

const FEATURES_PATIENT = [
  {
    icon: ShieldCheck,
    title: "Données sécurisées",
    text: "Vos informations de santé sont chiffrées et stockées sur des serveurs certifiés HDS.",
  },
  {
    icon: CircleCheck,
    title: "Suivi en temps réel",
    text: "Visualisez l'évolution de vos constantes et recevez des alertes personnalisées.",
  },
  {
    icon: Stethoscope,
    title: "Téléconsultation",
    text: "Échangez facilement avec vos médecins via notre interface vidéo intégrée.",
  },
];

const FEATURES_DOCTOR = [
  {
    icon: HeartPulse,
    title: "Supervision clinique",
    text: "Accédez en temps réel aux données de santé et alertes critiques de vos patients.",
  },
  {
    icon: UserCheck,
    title: "Prescription simplifiée",
    text: "Gérez les protocoles de soins chroniques, posologies et ajustements thérapeutiques.",
  },
  {
    icon: ShieldCheck,
    title: "Conformité médicale",
    text: "Environnement sécurisé certifié HDS conforme aux normes de santé en vigueur.",
  },
];

export default function AuthLayout({ children, role = ROLES.PATIENT }) {
  const isDoctor = role === ROLES.DOCTOR;
  const features = isDoctor ? FEATURES_DOCTOR : FEATURES_PATIENT;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      {/* Panneau gauche avec image d'arrière-plan dynamique et superposition */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        {/* Image de fond : Médecin (transition fondu) */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform ${
            isDoctor ? "opacity-30 scale-100" : "opacity-0 scale-105"
          }`}
          style={{ backgroundImage: `url('${BACKGROUND_IMAGES[ROLES.DOCTOR]}')` }}
          aria-hidden="true"
        />

        {/* Image de fond : Patient (transition fondu) */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out transform ${
            !isDoctor ? "opacity-30 scale-100" : "opacity-0 scale-105"
          }`}
          style={{ backgroundImage: `url('${BACKGROUND_IMAGES[ROLES.PATIENT]}')` }}
          aria-hidden="true"
        />

        {/* Dégradé sombre pour garantir un contraste et une lisibilité parfaits */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-brand-900/85 to-brand-950/95"
          aria-hidden="true"
        />

        {/* En-tête : Logo */}
        <div className="relative z-10">
          <Logo />
        </div>

        {/* Contenu textuel adapté au rôle */}
        <div className="relative z-10 max-w-md">
          {isDoctor ? (
            <>
              <h1 className="text-3xl font-bold leading-tight">
                Pratique médicale connectée,
                <span className="block text-brand-500">au service de vos patients.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Supervisez vos dossiers patients, ajustez les prescriptions en temps réel et
                coordonnez les parcours de soins des maladies chroniques.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold leading-tight">
                Votre santé, notre priorité,
                <span className="block text-brand-500">partout et à tout moment.</span>
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Accédez à votre espace sécurisé pour suivre vos traitements, consulter vos mesures
                quotidiennes et échanger avec vos professionnels de santé.
              </p>
            </>
          )}

          <ul className="mt-8 space-y-5">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-500 shadow-sm">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs leading-relaxed text-slate-300">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 text-xs text-slate-400">
          © {new Date().getFullYear()} ChronicCare — Plateforme sécurisée de santé
        </div>
      </aside>

      {/* Formulaire à droite */}
      <main className="flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo dark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
