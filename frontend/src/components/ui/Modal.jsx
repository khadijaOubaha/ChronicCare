import { X } from "lucide-react";
import { useEffect } from "react";
import Alert from "./Alert";
import Button from "./Button";

export default function Modal({ title, description, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-brand-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="rounded p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel, danger, loading, error, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{message}</p>
      {error && <div className="mt-3"><Alert>{error}</Alert></div>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
