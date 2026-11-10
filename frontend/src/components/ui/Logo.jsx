import { Activity } from "lucide-react";

export default function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white">
        <Activity className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold ${dark ? "text-brand-900" : "text-brand-500"}`}>
        ChronicCare
      </span>
    </div>
  );
}
