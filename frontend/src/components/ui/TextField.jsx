import { forwardRef, useId } from "react";

// icon : composant lucide à gauche ; trailing : élément à droite (ex. bouton œil).
const TextField = forwardRef(function TextField(
  { label, labelAside, icon: Icon, trailing, error, className = "", ...props },
  ref
) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={`h-11 w-full rounded-lg border bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 ${
            Icon ? "pl-9" : "pl-3"
          } ${trailing ? "pr-10" : "pr-3"} ${
            error ? "border-red-400" : "border-slate-200 focus:border-brand-500"
          }`}
          {...props}
        />
        {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default TextField;
