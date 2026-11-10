export default function Card({ className = "", children }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>{children}</section>;
}
