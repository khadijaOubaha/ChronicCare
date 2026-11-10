import { Pill } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { DISEASE_LABELS, STATUS_LABELS, expiringIn, formatDate } from "../../utils/format";

const STATUS_TONE = { ACTIVE: "green", COMPLETED: "slate", STOPPED: "red" };

// patientName : affiché côté médecin. actions : boutons (modifier, arrêter…).
export default function TreatmentCard({ treatment: t, patientName, actions }) {
  const expiring = expiringIn(t);
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
          <Pill className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-slate-800">{t.medication_name} · {t.dosage}</h3>
            <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABELS[t.status]}</Badge>
            {expiring !== null && (
              <Badge tone="amber">{expiring < 0 ? "Échu" : `Fin dans ${expiring} j`}</Badge>
            )}
          </div>
          {patientName && <p className="text-sm font-medium text-brand-900">{patientName}</p>}
          <p className="text-sm text-slate-500">
            {t.frequency} · {DISEASE_LABELS[t.disease] ?? t.disease}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Depuis le {formatDate(t.start_date)}
            {t.end_date ? ` · jusqu'au ${formatDate(t.end_date)}` : " · sans date de fin"}
          </p>
          {t.instructions && (
            <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm italic text-slate-600">{t.instructions}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </article>
  );
}
