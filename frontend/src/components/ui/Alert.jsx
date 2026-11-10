import { AlertCircle, CheckCircle2 } from "lucide-react";

const STYLES = {
  error: { box: "border-red-200 bg-red-50 text-red-800", Icon: AlertCircle },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-800", Icon: CheckCircle2 },
};

export default function Alert({ type = "error", children }) {
  const { box, Icon } = STYLES[type];
  return (
    <div
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${box}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
