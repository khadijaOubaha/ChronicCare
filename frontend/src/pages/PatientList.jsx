
import { Calendar, FileText, Plus, Search, Video } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { tokenStorage } from "../auth/tokenStorage";
import { JoinButton, TeleRow } from "../components/Common";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import Tabs from "../components/ui/Tabs";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/ui/StateViews";
import { isUpcoming, parseUtc, timeLabel, useNow } from "../lib/tele";

// Recherche du médecin depuis la liste dynamique de l'API.
export const doctorWho = (consultation, doctors = []) => {
  if (!consultation?.doctor_id) {
    return {
      name: "Médecin",
      sub: "Nom indisponible",
    };
  }

  const doctor = doctors.find(
    (d) => d.id === consultation.doctor_id
  );

  return doctor
    ? {
        name: doctor.full_name || "Médecin",
        sub: "Médecin",
      }
    : {
        name: "Médecin",
        sub: "Nom indisponible",
      };
};

export default function PatientList() {
  const { user, loading } = useAuth();
  const token = tokenStorage.get();
  const now = useNow();

  const [items, setItems] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState("");
  const [doctorError, setDoctorError] = useState("");
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [tab, setTab] = useState("upcoming");
  const [filter, setFilter] = useState("");

  // Chargement des téléconsultations.
  const load = useCallback(() => {
    api
      .list(token)
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : []);
        setError("");
      })
      .catch((e) => {
        setError(e.message || "Impossible de charger les téléconsultations.");
      });
  }, [token]);

  // Chargement dynamique des médecins depuis Teleconsultations Service.
  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);

    try {
      const data = await api.doctors(token);

      setDoctors(Array.isArray(data) ? data : []);
      setDoctorError("");
    } catch (e) {
      setDoctors([]);
      setDoctorError(
        e.message || "Impossible de charger les médecins."
      );
    } finally {
      setDoctorsLoading(false);
    }
  }, [token]);

  // Chargement initial.
  useEffect(() => {
    if (loading || !token || !user?.id) return;

    load();
    loadDoctors();

    // Actualiser les téléconsultations toutes les minutes.
    const intervalId = setInterval(load, 60000);

    return () => clearInterval(intervalId);
  }, [loading, token, user?.id, load, loadDoctors]);

  // Calcul des statistiques et des consultations à afficher.
  const {
    upcoming,
    history,
    nextOne,
    monthCount,
    reports,
  } = useMemo(() => {
    const all = items || [];

    const up = all.filter((t) => isUpcoming(t, now));

    const sched = up
      .filter((t) => t.status === "SCHEDULED")
      .sort(
        (a, b) =>
          parseUtc(a.scheduled_at) - parseUtc(b.scheduled_at)
      );

    const sameMonth = (t) => {
      const date = parseUtc(t.scheduled_at);

      return (
        date &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    };

    return {
      upcoming: up,
      history: all.filter((t) => !isUpcoming(t, now)).reverse(),
      nextOne: sched[0],
      monthCount: all.filter(
        (t) =>
          sameMonth(t) &&
          t.status !== "CANCELLED" &&
          t.status !== "REQUESTED"
      ).length,
      reports: all.filter(
        (t) => t.status === "COMPLETED" && t.notes
      ).length,
    };
  }, [items, now]);

  // Filtrage par nom réel du médecin.
  const shown = (tab === "upcoming" ? upcoming : history).filter(
    (t) =>
      doctorWho(t, doctors)
        .name.toLowerCase()
        .includes(filter.trim().toLowerCase())
  );

  const start = nextOne
    ? parseUtc(nextOne.scheduled_at)
    : null;

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes téléconsultations"
        description="Gérez vos rendez-vous avec vos médecins."
        actions={
          <Link to="/teleconsultations/nouveau">
            <Button type="button">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Prendre un rendez-vous
            </Button>
          </Link>
        }
      />

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Prochaine session"
          value={
            start
              ? `${pad(start.getDate())}/${pad(start.getMonth() + 1)}`
              : "—"
          }
          hint={
            start
              ? `${timeLabel(start)} · ${doctorWho(nextOne, doctors).name}`
              : "Aucune planifiée"
          }
          icon={Video}
        />

        <StatCard
          label="Sessions ce mois"
          value={pad(monthCount)}
          hint={`${upcoming.filter((t) => t.status === "SCHEDULED").length} à venir`}
          icon={Calendar}
        />

        <StatCard
          label="Comptes rendus"
          value={pad(reports)}
          hint="disponibles"
          icon={FileText}
        />
      </div>

      {/* Onglets et recherche */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "upcoming", label: "À venir" },
            { id: "history", label: "Historique" },
          ]}
        />

        <label className="relative">
          <span className="sr-only">Filtrer par médecin</span>

          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />

          <input
            className="h-10 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            placeholder="Filtrer par médecin…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </div>

      {/* Liste des téléconsultations */}
      <div className="space-y-3">
        {error && (
          <ErrorState error={error} onRetry={load} />
        )}

        {doctorError && (
          <p className="text-sm text-amber-700">
            {doctorError}
          </p>
        )}

        {items === null && !error && (
          <LoadingState />
        )}

        {doctorsLoading && (
          <p className="text-sm text-slate-500">
            Chargement des médecins...
          </p>
        )}

        {items !== null && shown.length === 0 && (
          <EmptyState
            title={
              tab === "upcoming"
                ? "Aucune téléconsultation à venir."
                : "Aucune téléconsultation passée."
            }
          />
        )}

        {shown.map((t) => (
          <TeleRow
            key={t.id}
            t={t}
            now={now}
            who={doctorWho(t, doctors)}
            detailsTo={`/teleconsultations/${t.id}`}
            actions={
              <JoinButton t={t} now={now} />
            }
          />
        ))}
      </div>

      {/* Conseils de préparation */}
      <div className="rounded-xl bg-brand-100 p-4 text-sm text-brand-900">
        <b>Préparer votre téléconsultation</b>
        {" · "}
        Testez votre micro et vos haut-parleurs, vérifiez
        l'éclairage, rassemblez vos analyses récentes et
        notez vos symptômes.
      </div>
    </div>
  );
}
