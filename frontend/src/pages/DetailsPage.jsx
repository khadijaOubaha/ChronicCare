
import {
  ArrowLeft,
  Camera,
  FileText,
  Mic,
  Smartphone,
  Video,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { teleconsultationsApi } from "../api/teleconsultationsApi";
import { patientsApi } from "../api/patientsApi";
import { getErrorMessage } from "../utils/errors";
import { useAuth } from "../auth/AuthContext";
import { tokenStorage } from "../auth/tokenStorage";
import { ROLES } from "../auth/roles";

import {
  Avatar,
  StatusBadge,
  btnPrimarySm,
} from "../components/Common";

import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import PageHeader from "../components/ui/PageHeader";
import { LoadingState } from "../components/ui/StateViews";

import {
  DURATION_MIN,
  isAutoLink,
  liveState,
  longDate,
  meetingUrl,
  parseUtc,
  STATUS_LABELS,
  ticketNumber,
  timeLabel,
  useNow,
  JOIN_BEFORE_MIN,
} from "../lib/tele";

// --------------------------------------------------
// Test de connexion
// --------------------------------------------------

function ConnectionTest() {
  const [state, setState] = useState({
    phase: "idle",
    text: "Micro, caméra et réseau",
  });

  async function run() {
    setState({
      phase: "run",
      text: "Test en cours…",
    });

    const parts = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      const audio = stream.getAudioTracks().length > 0;
      const video = stream.getVideoTracks().length > 0;

      stream.getTracks().forEach((track) => track.stop());

      parts.push(
        audio ? "Micro OK" : "Micro absent",
        video ? "Caméra OK" : "Caméra absente"
      );
    } catch {
      parts.push(
        "Micro/caméra inaccessibles (autorisation refusée ou appareil absent)"
      );
    }

    parts.push(
      navigator.onLine ? "Réseau OK" : "Hors ligne"
    );

    const ok = parts.every((part) => /OK$/.test(part));

    setState({
      phase: ok ? "ok" : "warn",
      text: parts.join(" · "),
    });
  }

  const tone =
    state.phase === "ok"
      ? "text-emerald-700"
      : state.phase === "warn"
        ? "text-amber-700"
        : "text-slate-500";

  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <Smartphone
            className="h-4 w-4"
            aria-hidden="true"
          />
        </span>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Test de connexion
          </p>

          <p className={`text-xs ${tone}`}>
            {state.text}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        className="h-9 px-3"
        onClick={run}
        disabled={state.phase === "run"}
      >
        Lancer le test
      </Button>
    </Card>
  );
}

// --------------------------------------------------
// Page détails de la téléconsultation
// --------------------------------------------------

export default function DetailsPage() {
  const { id } = useParams();

  const { user, loading } = useAuth();

  const token = tokenStorage.get();
  const now = useNow();

  const [t, setT] = useState(null);
  const [patientName, setPatientName] = useState("");

  // Médecin récupéré dynamiquement depuis PostgreSQL.
  const [doctor, setDoctor] = useState(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [doctorError, setDoctorError] = useState("");

  const [error, setError] = useState("");

  const isDoctor = user?.role === ROLES.DOCTOR;

  // --------------------------------------------------
  // 1. Charger les détails de la téléconsultation
  // --------------------------------------------------

  useEffect(() => {
    if (loading || !token || !user?.id) return;

    let cancelled = false;

    async function loadTeleconsultation() {
      try {
        const data = await teleconsultationsApi.get(id);

        if (!cancelled) {
          setT(data);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e.response?.status === 404
              ? "Téléconsultation introuvable."
              : getErrorMessage(e)
          );
        }
      }
    }

    loadTeleconsultation();

    return () => {
      cancelled = true;
    };
  }, [loading, token, user?.id, id]);

  // --------------------------------------------------
  // 2. Charger le médecin depuis l'API dynamique
  // --------------------------------------------------

  useEffect(() => {
    if (loading || !token || !user?.id || !t?.doctor_id) {
      return;
    }

    let cancelled = false;

    async function loadDoctor() {
      setDoctor(null);
      setDoctorError("");
      setDoctorLoading(true);

      try {
        const doctors = await teleconsultationsApi.doctors();

        const foundDoctor = doctors.find(
          (d) => d.id === t.doctor_id
        );

        if (!cancelled) {
          setDoctor(foundDoctor || null);

          if (!foundDoctor) {
            setDoctorError(
              "Le médecin associé à cette consultation est introuvable dans l'annuaire."
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setDoctor(null);
          setDoctorError(
            getErrorMessage(e)
          );
        }
      } finally {
        if (!cancelled) {
          setDoctorLoading(false);
        }
      }
    }

    loadDoctor();

    return () => {
      cancelled = true;
    };
  }, [loading, token, user?.id, t?.doctor_id]);

  // --------------------------------------------------
  // 3. Récupérer le nom du patient
  // --------------------------------------------------

  useEffect(() => {
    if (loading || !user || !token || !t) return;

    let cancelled = false;

    async function loadPatient() {
      if (!isDoctor) {
        setPatientName(user.name || "Patient");
        return;
      }

      try {
        const data = await patientsApi.list({ limit: 100 });
        const list = Array.isArray(data) ? data : (data?.items ?? []);

        if (cancelled) return;

        const patient = list.find(
          (p) => p.id === t.patient_id
        );

        setPatientName(
          patient
            ? `${patient.first_name} ${patient.last_name}`
            : `Patient #${t.patient_id.slice(0, 8)}`
        );
      } catch {
        if (!cancelled) {
          setPatientName(
            `Patient #${t.patient_id.slice(0, 8)}`
          );
        }
      }
    }

    loadPatient();

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    isDoctor,
    token,
    user?.name,
    user?.id,
    t,
  ]);

  // --------------------------------------------------
  // 4. Bouton retour
  // --------------------------------------------------

  const back = (
    <Link to="/teleconsultations">
      <Button type="button" variant="secondary">
        <ArrowLeft
          className="h-4 w-4"
          aria-hidden="true"
        />
        Retour
      </Button>
    </Link>
  );

  // --------------------------------------------------
  // 5. Gestion du chargement et des erreurs
  // --------------------------------------------------

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Détails du rendez-vous"
          actions={back}
        />

        <Alert>{error}</Alert>
      </div>
    );
  }

  if (!t) {
    return <LoadingState />;
  }

  // --------------------------------------------------
  // 6. Informations du médecin et de la consultation
  // --------------------------------------------------

  const doctorName = doctor?.full_name?.trim()
    || (doctorLoading ? "Chargement du médecin..." : "Médecin");

  const doctorSubtitle = doctor
    ? "Médecin"
    : doctorLoading
      ? "Chargement..."
      : "Nom indisponible";

  const start = parseUtc(t.scheduled_at);
  const live = liveState(t, now);

  const canJoinLater =
    t.status === "SCHEDULED" &&
    !live &&
    start &&
    now < start;

  // Informations du rendez-vous.
  const rows = [
    [
      "Date",
      start
        ? longDate(start)
        : "À fixer par le médecin",
    ],
    [
      "Heure",
      start ? timeLabel(start) : "—",
    ],
    [
      "Durée prévue",
      `${DURATION_MIN} minutes`,
    ],
    [
      "Patient",
      patientName || "Chargement...",
    ],
    [
      "Motif",
      t.notes || "—",
    ],
    [
      "Statut",
      STATUS_LABELS[t.status] || t.status,
    ],
  ];

  if (t.status === "SCHEDULED") {
    rows.push([
      "Salle",
      isAutoLink(t)
        ? "Salle ChronicCare (lien automatique)"
        : "Lien fourni par le médecin",
    ]);
  }

  // Conseils de préparation.
  const PREP = [
    [
      Mic,
      "Micro et haut-parleurs",
      "Vérifiez que le son fonctionne",
    ],
    [
      Camera,
      "Caméra et éclairage",
      "Placez-vous face à une source de lumière",
    ],
    [
      FileText,
      "Analyses récentes",
      "Ayez vos résultats sous la main",
    ],
  ];

  // --------------------------------------------------
  // 7. Affichage
  // --------------------------------------------------

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détails du rendez-vous"
        description={`Consultation n° ${ticketNumber(t)}`}
        actions={back}
      />

      {/* Informations du médecin */}
      <Card className="flex flex-wrap items-center gap-4">
        <Avatar name={doctorName} size={52} />

        <div className="flex-1">
          <p className="font-semibold text-slate-800">
            {doctorName}
          </p>

          <p className="text-sm text-slate-500">
            {doctorSubtitle}
          </p>

          {doctorError && (
            <p className="mt-1 text-xs text-amber-700">
              {doctorError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge t={t} now={now} />

          {live && (
            <a
              className={`${btnPrimarySm} h-10 px-4`}
              href={meetingUrl(t)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Video
                className="h-4 w-4"
                aria-hidden="true"
              />
              Rejoindre la session
            </a>
          )}

          {canJoinLater && (
            <Button
              type="button"
              disabled
              title={`Disponible ${JOIN_BEFORE_MIN} min avant l'heure`}
            >
              <Video
                className="h-4 w-4"
                aria-hidden="true"
              />
              Rejoindre la session
            </Button>
          )}
        </div>
      </Card>

      {/* Information sur l'activation du lien */}
      {canJoinLater && (
        <p className="text-sm text-slate-500">
          Le bouton « Rejoindre » s'active{" "}
          {JOIN_BEFORE_MIN} minutes avant l'heure du rendez-vous.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Informations de la consultation */}
        <Card>
          <h2 className="mb-4 text-lg font-bold text-brand-900">
            Informations de la consultation
          </h2>

          <dl className="divide-y divide-slate-100 text-sm">
            {rows.map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-4 py-2.5"
              >
                <dt className="text-slate-500">
                  {key}
                </dt>

                <dd className="text-right font-medium text-slate-800">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {t.status === "REQUESTED" && (
            <div className="mt-4">
              <Alert type="success">
                Demande transmise au médecin.{" "}
                {isDoctor
                  ? "Confirmez-la depuis la liste."
                  : "Vous serez informé dès sa confirmation."}
              </Alert>
            </div>
          )}
        </Card>

        {/* Préparation de la téléconsultation */}
        <div className="space-y-4">
          <Card>
            <h2 className="mb-4 text-lg font-bold text-brand-900">
              Préparer votre téléconsultation
            </h2>

            <ul className="space-y-4">
              {PREP.map(([Icon, title, hint]) => (
                <li
                  key={title}
                  className="flex items-center gap-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <Icon
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {title}
                    </p>

                    <p className="text-xs text-slate-500">
                      {hint}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <ConnectionTest />
        </div>
      </div>
    </div>
  );
}
