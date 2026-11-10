import { ShieldCheck, Stethoscope, CircleCheck } from "lucide-react";
import Logo from "../components/ui/Logo";

const FEATURES = [
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

export default function AuthLayout({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1fr]">
      <aside className="hidden flex-col justify-between bg-brand-900 p-12 text-white lg:flex">
        <Logo />
        <div className="max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            Votre santé, notre priorité,
            <span className="block text-brand-500">partout et à tout moment.</span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Accédez à votre espace sécurisé pour suivre vos traitements, consulter vos mesures
            quotidiennes et échanger avec vos professionnels de santé.
          </p>
          <ul className="mt-8 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-brand-500">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs leading-relaxed text-slate-300">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden="true" />
      </aside>

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
