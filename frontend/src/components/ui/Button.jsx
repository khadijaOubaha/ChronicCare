import Spinner from "./Spinner";

const VARIANTS = {
  primary: "bg-brand-900 text-white hover:bg-brand-800 disabled:hover:bg-brand-900",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
