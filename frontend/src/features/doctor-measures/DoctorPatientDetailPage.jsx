
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  HeartPulse,
  Scale,
  Thermometer,
  TrendingUp,
  User,
} from "lucide-react";

import { patientsApi } from "../../api/patientsApi";
import { mesuresApi } from "../../api/mesuresApi";

import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import SelectField from "../../components/ui/SelectField";
import StatCard from "../../components/ui/StatCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../../components/ui/StateViews";

import EvolutionChart from "../mesures/EvolutionChart";
import { fullName } from "../patients/patientUtils";
import { ageFrom } from "../../utils/format";
import { getErrorMessage } from "../../utils/errors";

const DISEASE_LABELS = {
  TYPE_2_DIABETES: "Diabète de type 2",
  HYPERTENSION: "Hypertension artérielle",
};

const MAIN_MEASURE_CODES = {
  TYPE_2_DIABETES: "glycemie",
  HYPERTENSION: "tension_arterielle",
};

const TYPE_ICONS = {
  glycemie: Activity,
  tension_arterielle: HeartPulse,
  poids: Scale,
  temperature: Thermometer,
  temperature_corporelle: Thermometer,
  frequence_cardiaque: HeartPulse,
};

const PAGE_SIZE = 10;

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeZone: "Africa/Casablanca",
  }).format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  }).format(new Date(value));
}

function formatValue(value) {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function DoctorPatientDetailPage() {
  const { id } = useParams();

  const [patient, setPatient] = useState(null);
  const [profil, setProfil] = useState(null);
  const [resume, setResume] = useState(null);
  const [types, setTypes] = useState([]);
  const [chart, setChart] = useState(null);
  const [history, setHistory] = useState(null);

  const [selectedType, setSelectedType] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPatientData() {
      setLoading(true);
      setError("");

      try {
        const [
          patientData,
          profilData,
          resumeData,
          typesData,
        ] = await Promise.all([
          patientsApi.get(id),
          mesuresApi.getProfil(id),
          mesuresApi.getToday(id),
          mesuresApi.getTypes(id),
        ]);

        if (cancelled) return;

        setPatient(patientData);
        setProfil(profilData);
        setResume(resumeData);
        setTypes(typesData);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPatientData();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const disease = patient?.disease;

  const mainType = useMemo(() => {
    const mainCode = MAIN_MEASURE_CODES[disease];

    return (
      types.find((type) => type.code === mainCode) ||
      types.find((type) => type.id === profil?.type_principal_id) ||
      null
    );
  }, [types, disease, profil]);

  const activeType = useMemo(
    () => types.find((type) => type.id === selectedType) || mainType,
    [types, selectedType, mainType]
  );

  useEffect(() => {
    if (!id || !activeType) return;

    let cancelled = false;

    async function loadHistoryAndChart() {
      try {
        const params = {
          type_mesure_id: activeType.id,
          jours: 30,
        };

        const [historyData, chartData] = await Promise.all([
          mesuresApi.getHistory(id, {
            type_mesure_id: activeType.id,
            page,
            page_size: PAGE_SIZE,
          }),
          mesuresApi.getChart(id, params),
        ]);

        if (cancelled) return;

        setHistory(historyData);
        setChart(chartData);
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      }
    }

    loadHistoryAndChart();

    return () => {
      cancelled = true;
    };
  }, [id, activeType, page]);

  const chartPoints = useMemo(
    () =>
      (chart?.points || []).map((point) => ({
        v1: point.valeur,
        label: formatDate(point.jour),
      })),
    [chart]
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error && !patient) {
    return (
      <div className="space-y-4">
        <Link to="/mesures-patients">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Retour aux patients
          </Button>
        </Link>
        <ErrorState error={error} />
      </div>
    );
  }

  if (!patient) {
    return (
      <EmptyState
        title="Patient introuvable"
        description="Ce dossier patient n'est pas disponible."
      />
    );
  }

  const cards = resume?.cartes || [];
  const recorded = resume?.enregistrees ?? 0;
  const total = resume?.total ?? cards.length;
  const remaining = resume?.restantes?.length ?? 0;

  const historyItems = history?.items || [];
  const totalPages = history?.total_pages || 1;

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/mesures-patients"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste des patients
        </Link>

        <PageHeader
          title={fullName(patient)}
          description="Consultation du dossier et suivi des mesures du patient."
        />
      </div>

      {error && <Alert>{error}</Alert>}

      {/* Informations personnelles */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-800">
              <User className="h-7 w-7" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {fullName(patient)}
              </h2>
              <p className="text-sm text-slate-500">
                {patient.email || "Email non renseigné"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {patient.phone || "Téléphone non renseigné"}
              </p>
            </div>
          </div>

          <Badge tone={patient.is_active ? "green" : "slate"}>
            {patient.is_active ? "Actif" : "Inactif"}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-400">Âge</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {ageFrom(patient.date_of_birth)
                ? `${ageFrom(patient.date_of_birth)} ans`
                : "Non renseigné"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Sexe</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {patient.sex === "M"
                ? "Homme"
                : patient.sex === "F"
                  ? "Femme"
                  : "Non renseigné"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Pathologie</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {DISEASE_LABELS[patient.disease] || patient.disease || "Non spécifiée"}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-400">Date de naissance</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">
              {formatDate(patient.date_of_birth)}
            </p>
          </div>
        </div>
      </Card>

      {/* Résumé des mesures du jour */}
      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          Résumé des mesures du jour
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Mesures enregistrées"
            value={recorded}
            hint={`Sur ${total} mesures attendues`}
            icon={Activity}
          />

          <StatCard
            label="Mesures restantes"
            value={remaining}
            hint="À renseigner aujourd'hui"
            icon={CalendarDays}
          />

          <StatCard
            label="Date du suivi"
            value={formatDate(resume?.date_du_jour || profil?.date_du_jour)}
            hint="Fuseau horaire : Casablanca"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Détail des cartes du jour */}
      <Card>
        <h2 className="mb-4 text-base font-semibold text-slate-800">
          État des mesures aujourd'hui
        </h2>

        {cards.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucune mesure attendue pour ce patient.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => {
              const Icon = TYPE_ICONS[card.type_mesure?.code] || Activity;
              const isRecorded = card.statut === "enregistree";

              return (
                <div
                  key={card.type_mesure.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-brand-700" />
                      <span className="text-sm font-medium text-slate-700">
                        {card.type_mesure.nom}
                      </span>
                    </div>

                    <Badge tone={isRecorded ? "green" : "amber"}>
                      {isRecorded ? "Enregistrée" : "À renseigner"}
                    </Badge>
                  </div>

                  {card.mesure ? (
                    <p className="mt-3 text-xl font-semibold text-brand-900">
                      {formatValue(card.mesure.valeur)}
                      {card.mesure.valeur_secondaire !== null &&
                        card.mesure.valeur_secondaire !== undefined &&
                        ` / ${formatValue(card.mesure.valeur_secondaire)}`}
                      <span className="ml-1 text-sm font-normal text-slate-500">
                        {card.mesure.unite}
                      </span>
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">
                      Aucune valeur enregistrée aujourd'hui.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Graphique d'évolution */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Évolution des mesures
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Évolution sur les 30 derniers jours.
            </p>
          </div>

          {mainType && (
            <Badge tone="brand">
              {mainType.nom}
            </Badge>
          )}
        </div>

        {chart ? (
          <EvolutionChart
            points={chartPoints}
            label={chart.type_mesure?.nom || mainType?.nom || "Évolution"}
            unit={chart.type_mesure?.unite || mainType?.unite || ""}
          />
        ) : (
          <p className="text-sm text-slate-500">
            Aucune donnée disponible pour cette période.
          </p>
        )}
      </Card>

      {/* Historique */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Historique des mesures
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Consultez les enregistrements du patient.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <SelectField
              value={selectedType}
              onChange={(event) => {
                setSelectedType(event.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "Mesure principale" },
                ...types.map((type) => ({
                  value: type.id,
                  label: type.nom,
                })),
              ]}
            />
          </div>
        </div>

        {!activeType ? (
          <p className="text-sm text-slate-500">
            Aucun type de mesure disponible.
          </p>
        ) : historyItems.length === 0 ? (
          <EmptyState
            title="Aucune mesure enregistrée"
            description="Aucun enregistrement ne correspond à ce type de mesure."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Valeur</th>
                    <th className="px-4 py-3">Commentaire</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {historyItems.map((measure) => (
                    <tr key={measure.id}>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDateTime(measure.date_mesure)}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-700">
                        {measure.type_nom}
                      </td>

                      <td className="px-4 py-3 font-semibold text-brand-900">
                        {formatValue(measure.valeur)}
                        {measure.valeur_secondaire !== null &&
                          measure.valeur_secondaire !== undefined &&
                          ` / ${formatValue(measure.valeur_secondaire)}`}
                        <span className="ml-1 text-xs font-normal text-slate-500">
                          {measure.unite}
                        </span>
                      </td>

                      <td className="max-w-xs px-4 py-3 text-slate-500">
                        {measure.commentaire || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Page {history?.page || page} sur {totalPages}
                {" · "}
                {history?.total || 0} mesure(s)
              </p>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Précédent
                </Button>

                <Button
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Suivant
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
