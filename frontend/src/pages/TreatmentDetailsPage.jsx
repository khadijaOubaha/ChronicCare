import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Pill,
  Square,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "../components/ui/Alert";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PageHeader from "../components/ui/PageHeader";
import { ErrorState, LoadingState } from "../components/ui/StateViews";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../auth/roles";
import { patientsApi } from "../api/patientsApi";
import { treatmentsApi } from "../api/treatmentsApi";
import { fullName } from "../features/patients/patientUtils";
import { getErrorMessage } from "../utils/errors";
import { formatDate } from "../utils/formatters";

const DISEASE_LABELS = {
  TYPE_2_DIABETES: "Diabète de type 2",
  HYPERTENSION: "Hypertension artérielle",
};

export default function TreatmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [treatment, setTreatment] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showStopModal, setShowStopModal] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  const isDoctor = user?.role === ROLES.DOCTOR;

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    treatmentsApi
      .get(id)
      .then((t) => {
        if (!isMounted) return;
        setTreatment(t);
        // Charger les données du patient si possible
        if (t.patient_id) {
          patientsApi
            .get(t.patient_id)
            .then((p) => isMounted && setPatient(p))
            .catch(() => {});
        }
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

  const handleStop = async () => {
    setStopping(true);
    setActionError("");
    try {
      const updated = await treatmentsApi.stop(id);
      setTreatment(updated);
      setShowStopModal(false);
      setNotice("Le traitement a été arrêté avec succès.");
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setStopping(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !treatment) {
    return (
      <ErrorState
        error={error || new Error("Traitement introuvable")}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Calcul de la progression
  let progressPercent = null;
  let daysElapsed = null;
  let totalDays = null;

  if (treatment.start_date) {
    const start = new Date(treatment.start_date);
    const now = new Date();
    const elapsedMs = now.getTime() - start.getTime();
    daysElapsed = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));

    if (treatment.end_date) {
      const end = new Date(treatment.end_date);
      const totalMs = end.getTime() - start.getTime();
      totalDays = Math.max(1, Math.floor(totalMs / (1000 * 60 * 60 * 24)));
      progressPercent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
    }
  }

  const patientName = patient ? fullName(patient) : "Patient";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to={isDoctor ? "/prescriptions" : "/suivi"}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            title="Retour"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <PageHeader
            title={treatment.medication_name}
            description={`Prescription médicale • ${treatment.dosage}`}
          />
        </div>

        {isDoctor && treatment.status === "ACTIVE" && (
          <div className="flex gap-2">
            <Link to={`/prescriptions/${id}/modifier`}>
              <Button variant="secondary">
                <Edit className="h-4 w-4" /> Modifier
              </Button>
            </Link>
            <Button variant="danger" onClick={() => setShowStopModal(true)}>
              <Square className="h-4 w-4" /> Arrêter le traitement
            </Button>
          </div>
        )}
      </div>

      {notice && <Alert type="success">{notice}</Alert>}
      {actionError && <Alert>{actionError}</Alert>}

      {/* Jauge d'avancement si date de fin définie */}
      {progressPercent !== null && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Progression du traitement</h3>
              <p className="text-xs text-slate-500">
                {daysElapsed} jours écoulés sur un total de {totalDays} jours
              </p>
            </div>
            <span className="text-lg font-bold text-brand-600">{progressPercent}%</span>
          </div>

          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-500 ${
                treatment.status === "ACTIVE" ? "bg-brand-500" : "bg-slate-400"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Début : {formatDate(treatment.start_date)}</span>
            <span>Fin prévue : {formatDate(treatment.end_date)}</span>
          </div>
        </div>
      )}

      {/* Grille de détails */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Paramètres de prescription */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <Pill className="h-5 w-5 text-brand-600" /> Caractéristiques de la prescription
          </h3>

          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Médicament</dt>
              <dd className="font-bold text-slate-800">{treatment.medication_name}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Dosage</dt>
              <dd className="font-semibold text-slate-800">{treatment.dosage}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Fréquence de prise</dt>
              <dd className="font-medium text-slate-800">{treatment.frequency}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Statut</dt>
              <dd>
                <Badge variant={treatment.status === "ACTIVE" ? "success" : "neutral"}>
                  {treatment.status === "ACTIVE" ? "En cours d'administration" : "Arrêté"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Pathologie associée</dt>
              <dd className="font-semibold text-brand-700">
                {DISEASE_LABELS[treatment.disease] || treatment.disease || "Non spécifiée"}
              </dd>
            </div>
          </dl>
        </div>

        {/* Modalités & Patient */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-800">
            <User className="h-5 w-5 text-brand-600" /> Patient & Calendrier
          </h3>

          <dl className="mt-4 divide-y divide-slate-100 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Patient</dt>
              <dd>
                {patient ? (
                  <Link
                    to={`/patients/${patient.id}`}
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {patientName}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-800">{patientName}</span>
                )}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Date de début</dt>
              <dd className="font-medium text-slate-800">
                {formatDate(treatment.start_date)}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Date de fin</dt>
              <dd className="font-medium text-slate-800">
                {treatment.end_date ? formatDate(treatment.end_date) : "Traitement continu"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Date de prescription</dt>
              <dd className="font-medium text-slate-800">
                {treatment.created_at ? formatDate(treatment.created_at) : "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Instructions particulières */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800">Consignes médicales</h3>
        <p className="mt-3 text-sm text-slate-600">
          {treatment.instructions || "Aucune consigne particulière spécifiée pour ce traitement."}
        </p>
      </div>

      {/* Modal confirmation arrêt */}
      {showStopModal && (
        <Modal
          open={showStopModal}
          onClose={() => setShowStopModal(false)}
          title="Arrêter ce traitement"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Voulez-vous vraiment marquer le traitement <strong>{treatment.medication_name}</strong>{" "}
              comme arrêté ? Le statut passera à <em>STOPPED</em> et le patient ne sera plus tenu de le
              suivre.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowStopModal(false)}
                disabled={stopping}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleStop} loading={stopping}>
                Confirmer l'arrêt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
