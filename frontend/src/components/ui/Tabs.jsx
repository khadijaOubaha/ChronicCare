export default function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="inline-flex rounded-lg bg-slate-200/70 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`h-8 rounded-md px-4 text-sm font-medium transition-colors ${
            value === t.id ? "bg-white text-brand-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
