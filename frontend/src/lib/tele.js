import { useEffect, useState } from "react";

export const DURATION_MIN = 30; // durée fixe côté interface
export const JOIN_BEFORE_MIN = 10; // le bouton « Rejoindre » s'active 10 min avant

export const STATUS_LABELS = {
  REQUESTED: "En attente",
  SCHEDULED: "Planifiée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
};

/** Le backend renvoie des dates UTC sans fuseau : on les lit explicitement en UTC. */
export function parseUtc(value) {
  if (!value) return null;
  return new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

/** Lien de la salle : celui du médecin, sinon un lien Jitsi calculé depuis l'id. */
export function meetingUrl(t) {
  const own = (t.meeting_link || "").trim();
  return own || `https://meet.jit.si/ChronicCare-${t.id}`;
}

export const isAutoLink = (t) => !(t.meeting_link || "").trim();

export function endOf(t) {
  return new Date(parseUtc(t.scheduled_at).getTime() + DURATION_MIN * 60000);
}

/** 'live' (en cours), 'soon' (≤ 10 min avant) ou null. */
export function liveState(t, now = new Date()) {
  if (t.status !== "SCHEDULED" || !t.scheduled_at) return null;
  const start = parseUtc(t.scheduled_at);
  if (now >= start && now < endOf(t)) return "live";
  if (now >= new Date(start.getTime() - JOIN_BEFORE_MIN * 60000) && now < start) return "soon";
  return null;
}

/** « À venir » = demandes en attente + consultations planifiées pas encore terminées. */
export function isUpcoming(t, now = new Date()) {
  if (t.status === "REQUESTED") return true;
  return t.status === "SCHEDULED" && endOf(t) >= now;
}

export function ticketNumber(t) {
  const year = (parseUtc(t.scheduled_at) || parseUtc(t.created_at) || new Date()).getFullYear();
  return `TC-${year}-${t.id.slice(0, 4).toUpperCase()}`;
}

const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "2-digit" });
const longFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
const timeFmt = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function dayLabel(date, now = new Date()) {
  const short = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (date.toDateString() === now.toDateString()) return `Aujourd'hui, ${short}`;
  return cap(dayFmt.format(date).replace(/\s(\d{2}\/\d{2})$/, " $1"));
}
export const longDate = (date) => cap(longFmt.format(date));
export const timeLabel = (date) => timeFmt.format(date).replace(":", ":");

/** Valeur d'un <input type="datetime-local"> -> ISO UTC pour l'API. */
export const localInputToIso = (value) => (value ? new Date(value).toISOString() : null);

/** Date UTC de l'API -> valeur d'un <input type="datetime-local"> (heure locale). */
export function isoToLocalInput(value) {
  const d = parseUtc(value);
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Horloge qui se met à jour toutes les 30 s (badge « En direct », boutons). */
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
