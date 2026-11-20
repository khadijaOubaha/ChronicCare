import { Calendar, Clock, Eye, Video } from "lucide-react";
import { Link } from "react-router-dom";
import { initials } from "../data/doctors";
import { dayLabel, DURATION_MIN, liveState, meetingUrl, parseUtc, timeLabel } from "../lib/tele";
import Badge from "./ui/Badge";

export function Avatar({ name, size = 40 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-900"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name || "?")}
    </span>
  );
}

const STATUS = {
  REQUESTED: ["amber", "En attente"],
  SCHEDULED: ["brand", "À venir"],
  COMPLETED: ["green", "Terminée"],
  CANCELLED: ["slate", "Annulée"],
};

export function StatusBadge({ t, now }) {
  const live = liveState(t, now);
  if (live === "live") return <Badge tone="green">En direct</Badge>;
  if (live === "soon") return <Badge tone="amber">Bientôt</Badge>;
  const [tone, label] = STATUS[t.status] || ["slate", t.status];
  return <Badge tone={tone}>{label}</Badge>;
}

export const btnSm =
  "inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors";
export const btnPrimarySm = `${btnSm} bg-brand-900 text-white hover:bg-brand-800`;
export const btnOutlineSm = `${btnSm} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

/** Bouton « Rejoindre la session » : ouvre le lien (ou le lien Jitsi calculé). */
export function JoinButton({ t, now, label = "Rejoindre la session" }) {
  if (!liveState(t, now)) return null;
  return (
    <a className={btnPrimarySm} href={meetingUrl(t)} target="_blank" rel="noopener noreferrer">
      <Video className="h-4 w-4" aria-hidden="true" /> {label}
    </a>
  );
}

export function IconButton({ tone = "slate", className = "", ...props }) {
  const tones = {
    slate: "text-slate-500 hover:bg-slate-100",
    ok: "text-emerald-700 hover:bg-emerald-50",
    bad: "text-red-600 hover:bg-red-50",
  };
  return (
    <button
      type="button"
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white ${tones[tone]} ${className}`}
      {...props}
    />
  );
}

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const tone = toast.type === "err" ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <div role="status" onClick={onClose} className={`fixed bottom-6 right-6 z-50 cursor-pointer rounded-lg border px-4 py-3 text-sm shadow-lg ${tone}`}>
      {toast.text}
    </div>
  );
}

/** Ligne de consultation. who = { name, sub } : la personne affichée. */
export function TeleRow({ t, now, who, actions, detailsTo }) {
  const start = parseUtc(t.scheduled_at);
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <Avatar name={who.name} />
      <div className="min-w-[160px] flex-1">
        <p className="text-sm font-semibold text-slate-800">{who.name}</p>
        <p className="text-xs text-slate-500">{who.sub}</p>
      </div>
      <div className="min-w-[150px] text-sm">
        {start ? (
          <>
            <p className="flex items-center gap-1.5 text-slate-800"><Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {dayLabel(start, now)}</p>
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><Clock className="h-3 w-3 text-slate-400" aria-hidden="true" /> {timeLabel(start)} · {DURATION_MIN} min</p>
          </>
        ) : (
          <p className="text-xs text-slate-500">Date à fixer par le médecin</p>
        )}
      </div>
      <p className="hidden min-w-0 max-w-[220px] flex-1 truncate text-sm text-slate-500 xl:block">{t.notes || "—"}</p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <StatusBadge t={t} now={now} />
        {actions}
        {detailsTo && (
          <Link className={btnOutlineSm} to={detailsTo}>
            <Eye className="h-4 w-4" aria-hidden="true" /> Détails
          </Link>
        )}
      </div>
    </div>
  );
}
