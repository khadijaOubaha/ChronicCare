import {
  Activity,
  ArrowLeft,
  Calendar,
  Clock,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Pill,
  Plus,
  Shield,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/ui/Alert";
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

export default function PatientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const initials = `${patient.first_name?.[0] || ""}${patient.last_name?.[0] || ""}`.toUpperCase();

  // Calculer l'âge approximatif
  let age = null;
  if (patient.date_of_birth) {
    const dob = new Date(patient.date_of_birth);
    const diffMs = Date.now() - dob.getTime();
    age = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
  }

  return (
    <div className="space-y-6">
      {/* Barre supérieure navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/patients"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            title="Retour à la liste"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <PageHeader
            title={`Dossier de ${name}`}
            description="Fiche détaillée et historique médical du patient."
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/patients/${id}/modifier`}>
            <Button variant="secondary">
              <Edit className="h-4 w-4" /> Modifier
            </Button>
          </Link>
          <Link to={`/patients/${id}/dossier`}>
            <Button variant="secondary">
              <FileText className="h-4 w-4" /> Dossier médical complet
            </Button>
          </Link>
          <Link to={`/prescriptions?new=1&patient=${id}`}>
            <Button>
              <Plus className="h-4 w-4" /> Nouvelle prescription
            </Button>
          </Link>
        </div>
      </div>

      {/* En-tête profil du patient */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-900 text-2xl font-bold text-white shadow-inner">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">{name}</h2>
                <Badge variant={patient.is_active ? "success" : "neutral"}>
                  {patient.is_active ? "Actif" : "Inactif"}
                </Badge>
                {patient.disease && (
                  <Badge variant="brand">
                    {DISEASE_LABELS[patient.disease] || patient.disease}
                  </Badge>
                )}
              </div>
              <p className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {patient.email}
                </span>
                {patient.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {patient.phone}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations Personnelles */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <User className="h-5 w-5 text-brand-600" /> Informations Personnelles
          </h3>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Date de naissance</dt>
              <dd className="font-medium text-slate-800">
                {patient.date_of_birth ? formatDate(patient.date_of_birth) : "—"}{" "}
                {age !== null && <span className="text-slate-500">({age} ans)</span>}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Sexe</dt>
              <dd className="font-medium text-slate-800">
                {patient.sex === "M" ? "Masculin (M)" : patient.sex === "F" ? "Féminin (F)" : "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Numéro de téléphone</dt>
              <dd className="font-medium text-slate-800">{patient.phone || "Non renseigné"}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Adresse postale</dt>
              <dd className="max-w-xs text-right font-medium text-slate-800">
                {patient.address || "Non renseignée"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Informations Médicales & Suivi */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <Activity className="h-5 w-5 text-brand-600" /> Suivi Médical
          </h3>
          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Pathologie principale</dt>
              <dd className="font-semibold text-brand-700">
                {DISEASE_LABELS[patient.disease] || "Non spécifiée"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Statut du dossier</dt>
              <dd className="font-medium text-slate-800">
                {patient.is_active ? "Suivi en cours" : "Dossier suspendu"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Nombre de traitements prescrits</dt>
              <dd className="font-medium text-slate-800">{treatments.length}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Dossier créé le</dt>
              <dd className="font-medium text-slate-800">
                {patient.created_at ? formatDate(patient.created_at) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Traitements actuels du patient */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <Pill className="h-5 w-5 text-brand-600" /> Prescriptions et Traitements ({treatments.length})
          </h3>
          <Link
            to={`/prescriptions?new=1&patient=${id}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            + Ajouter un traitement
          </Link>
        </div>

        {treatments.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Aucun traitement n'a encore été prescrit pour ce patient.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {treatments.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{t.medication_name}</span>
                    <Badge variant={t.status === "ACTIVE" ? "success" : "neutral"}>
                      {t.status === "ACTIVE" ? "En cours" : "Arrêté"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t.dosage} • {t.frequency}
                    {t.instructions && ` • ${t.instructions}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Début : {formatDate(t.start_date)}
                  </span>
                  <Link
                    to={`/prescriptions/${t.id}`}
                    className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Détails →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
