import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  Pill,
  Plus,
  Scale,
  TrendingUp,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import { fullName } from "../features/patients/patientUtils";
import { formatDate } from "../utils/formatters";

const DISEASE_LABELS = {
  TYPE_2_DIABETES: "Diabète de type 2",
  HYPERTENSION: "Hypertension artérielle",
};

export default function MedicalRecordPage() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      patientsApi.get(id),
      treatmentsApi.forPatient(id).catch(() => []),
    ])
      .then(([patientData, treatmentsData]) => {
        if (!isMounted) return;
        setPatient(patientData);
        setTreatments(treatmentsData);
      })
      .catch((err) => {
        if (isMounted) setError(err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <LoadingState />;
  if (error || !patient) {
    return (
      <ErrorState
        error={error || new Error("Patient introuvable")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const name = fullName(patient);
  const activeTreatments = treatments.filter((t) => t.status === "ACTIVE");
  const pastTreatments = treatments.filter((t) => t.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Barre de retour et titre */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={`/patients/${id}`}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            title="Retour au profil"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <PageHeader
            title={`Dossier médical — ${name}`}
            description="Vue synthétique du suivi clinique, traitements et constantes."
          />
        </div>

        <Link to={`/prescriptions?new=1&patient=${id}`}>
          <Button>
            <Plus className="h-4 w-4" /> Nouvelle prescription
          </Button>
        </Link>
      </div>

      {/* Onglets navigation interne du dossier */}
      <div className="flex border-b border-slate-200">
        {[
          { key: "overview", label: "Vue d'ensemble" },
          { key: "treatments", label: `Traitements (${treatments.length})` },
          { key: "timeline", label: "Historique & Événements" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-brand-500 text-brand-900 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu Onglet Vue d'ensemble */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Cartes d'indicateurs cliniques */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Pathologie</span>
                <Activity className="h-5 w-5 text-brand-600" />
              </div>
              <p className="mt-2 text-base font-bold text-slate-800">
                {DISEASE_LABELS[patient.disease] || "Non spécifiée"}
              </p>
              <span className="mt-1 inline-block text-xs text-slate-500">Suivi actif</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Traitements actifs</span>
                <Pill className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">
                {activeTreatments.length}
              </p>
              <span className="mt-1 inline-block text-xs text-emerald-600">Prescription en cours</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Dernière mesure</span>
                <Heart className="h-5 w-5 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">128/82</p>
              <span className="mt-1 inline-block text-xs text-slate-500">Tension artérielle (mmHg)</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-500">Observance estimée</span>
                <TrendingUp className="h-5 w-5 text-sky-600" />
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-800">92%</p>
              <span className="mt-1 inline-block text-xs text-emerald-600">Bonne adhésion</span>
            </div>
          </div>

          {/* Grille Traitements actifs + Informations rapides */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">
                  Prescriptions actives ({activeTreatments.length})
                </h3>
                <Link
                  to={`/prescriptions?new=1&patient=${id}`}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  + Nouveau traitement
                </Link>
              </div>

              {activeTreatments.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Aucun traitement actif pour le moment.
                </p>
              ) : (
                <div className="mt-4 divide-y divide-slate-100">
                  {activeTreatments.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-semibold text-slate-800">{t.medication_name}</p>
                        <p className="text-xs text-slate-500">
                          {t.dosage} • {t.frequency}
                          {t.instructions && ` • ${t.instructions}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="success">Actif</Badge>
                        <p className="mt-1 text-xs text-slate-400">
                          Depuis le {formatDate(t.start_date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fiche récapitulative patient */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-800">Coordonnées</h3>
              <div className="text-sm space-y-2 text-slate-600">
                <p><strong>Email :</strong> {patient.email}</p>
                <p><strong>Téléphone :</strong> {patient.phone || "Non renseigné"}</p>
                <p><strong>Sexe :</strong> {patient.sex === "M" ? "Masculin" : "Féminin"}</p>
                <p><strong>Naissance :</strong> {patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"}</p>
                <p><strong>Adresse :</strong> {patient.address || "Non renseignée"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu Onglet Traitements */}
      {activeTab === "treatments" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800">
              Tous les traitements ({treatments.length})
            </h3>
            {treatments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Aucun traitement prescrit.</p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {treatments.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">{t.medication_name}</span>
                        <Badge variant={t.status === "ACTIVE" ? "success" : "neutral"}>
                          {t.status === "ACTIVE" ? "En cours" : "Arrêté"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        Posologie : {t.dosage} ({t.frequency})
                      </p>
                      {t.instructions && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          Instructions : {t.instructions}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        Du {formatDate(t.start_date)}
                        {t.end_date ? ` au ${formatDate(t.end_date)}` : " (durée indéterminée)"}
                      </span>
                      <Link
                        to={`/prescriptions/${t.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Consulter
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenu Onglet Historique / Timeline */}
      {activeTab === "timeline" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">Chronologie des soins</h3>
          <div className="mt-6 space-y-6 border-l-2 border-slate-200 pl-4 ml-2">
            <div className="relative">
              <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full border-2 border-white bg-brand-500" />
              <p className="text-xs font-semibold text-slate-500">Aujourd'hui</p>
              <p className="text-sm font-semibold text-slate-800">Consultation du dossier médical</p>
              <p className="text-xs text-slate-500">Accès aux constantes et prescriptions.</p>
            </div>

            {treatments.map((t) => (
              <div key={t.id} className="relative">
                <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
                <p className="text-xs font-semibold text-slate-500">
                  {formatDate(t.created_at || t.start_date)}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  Prescription de {t.medication_name} ({t.dosage})
                </p>
                <p className="text-xs text-slate-500">
                  Fréquence : {t.frequency} • Statut : {t.status === "ACTIVE" ? "Actif" : "Arrêté"}
                </p>
              </div>
            ))}

            <div className="relative">
              <div className="absolute -left-[25px] top-0 h-4 w-4 rounded-full border-2 border-white bg-slate-400" />
              <p className="text-xs font-semibold text-slate-500">
                {patient.created_at ? formatDate(patient.created_at) : "Création"}
              </p>
              <p className="text-sm font-semibold text-slate-800">Création de la fiche patient</p>
              <p className="text-xs text-slate-500">Ouverture du dossier ChronicCare.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
