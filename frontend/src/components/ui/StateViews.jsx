import { getErrorMessage } from "../../utils/errors";
import Alert from "./Alert";
import Button from "./Button";
import Spinner from "./Spinner";

export function LoadingState({ label = "Chargement…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500" role="status">
      <Spinner className="h-5 w-5 text-brand-600" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="space-y-3">
      <Alert>{getErrorMessage(error)}</Alert>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center">
      <p className="font-semibold text-slate-700">{title}</p>
      {children && <p className="mt-1 text-sm text-slate-500">{children}</p>}
    </div>
  );
}
