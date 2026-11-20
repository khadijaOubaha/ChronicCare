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
import { EmptyState, ErrorState, LoadingState } from "../components/ui/StateViews";
import { doctorById } from "../data/doctors";
import { isUpcoming, parseUtc, timeLabel, useNow } from "../lib/tele";

export const doctorWho = (t) => {
  const d = doctorById(t.doctor_id);
  return d ? { name: d.name, sub: d.specialty } : { name: "Médecin", sub: `#${t.doctor_id.slice(0, 8)}` };
};

export default function PatientList() {
  const { user, loading } = useAuth();
  const token = tokenStorage.get();
  const now = useNow();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("upcoming");
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    api
      .list(token)
      .then((data) => {
        setItems(data.items);
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    if (loading || !token || !user?.id) return;

    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [loading, token, user?.id, load]);

  const { upcoming, history, nextOne, monthCount, reports } = useMemo(() => {
    const all = items || [];
    const up = all.filter((t) => isUpcoming(t, now));
    const sched = up.filter((t) => t.status === "SCHEDULED").sort((a, b) => parseUtc(a.scheduled_at) - parseUtc(b.scheduled_at));
    const sameMonth = (t) => {
      const d = parseUtc(t.scheduled_at);
      return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    return {
      upcoming: up,
      history: all.filter((t) => !isUpcoming(t, now)).reverse(),
      nextOne: sched[0],
      monthCount: all.filter((t) => sameMonth(t) && t.status !== "CANCELLED" && t.status !== "REQUESTED").length,
      reports: all.filter((t) => t.status === "COMPLETED" && t.notes).length,
    };
  }, [items, now]);

  const shown = (tab === "upcoming" ? upcoming : history).filter((t) =>
    doctorWho(t).name.toLowerCase().includes(filter.trim().toLowerCase()),
  );
  const start = nextOne && parseUtc(nextOne.scheduled_at);
  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes téléconsultations"
        description="Gérez vos rendez-vous avec vos médecins."
        actions={
          <Link to="/teleconsultations/nouveau">
            <Button type="button"><Plus className="h-4 w-4" aria-hidden="true" /> Prendre un rendez-vous</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Prochaine session"
          value={start ? `${pad(start.getDate())}/${pad(start.getMonth() + 1)}` : "—"}
          hint={start ? `${timeLabel(start)} · ${doctorWho(nextOne).name}` : "Aucune planifiée"}
          icon={Video}
        />
        <StatCard label="Sessions ce mois" value={pad(monthCount)} hint={`${upcoming.filter((t) => t.status === "SCHEDULED").length} à venir`} icon={Calendar} />
        <StatCard label="Comptes rendus" value={pad(reports)} hint="disponibles" icon={FileText} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[{ id: "upcoming", label: "À venir" }, { id: "history", label: "Historique" }]}
        />
        <label className="relative">
          <span className="sr-only">Filtrer par médecin</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            className="h-10 w-64 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            placeholder="Filtrer par médecin…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
      </div>

      <div className="space-y-3">
        {error && <ErrorState error={error} onRetry={load} />}
        {items === null && !error && <LoadingState />}
        {items !== null && shown.length === 0 && (
          <EmptyState title={tab === "upcoming" ? "Aucune téléconsultation à venir." : "Aucune téléconsultation passée."} />
        )}
        {shown.map((t) => (
          <TeleRow key={t.id} t={t} now={now} who={doctorWho(t)} detailsTo={`/teleconsultations/${t.id}`} actions={<JoinButton t={t} now={now} />} />
        ))}
      </div>

      <div className="rounded-xl bg-brand-100 p-4 text-sm text-brand-900">
        <b>Préparer votre téléconsultation</b> · testez votre micro et vos haut-parleurs, vérifiez l'éclairage, rassemblez vos analyses récentes et notez vos symptômes.
      </div>
    </div>
  );
}
