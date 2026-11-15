import Card from "./Card";

export default function StatCard({ label, value, hint, icon: Icon }) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 font-mono text-2xl font-medium text-brand-900">{value}</p>
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      {Icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
    </Card>
  );
}
