export const Spinner = () => <div className="state"><div className="spinner" />Chargement…</div>;
export const EmptyState = ({ children }) => <div className="state">{children}</div>;
export const ErrorMessage = ({ error, onRetry }) => (
  <div className="state error">
    <p>{error?.message || 'Une erreur est survenue.'}</p>
    {onRetry && <button className="btn" onClick={onRetry}>Réessayer</button>}
  </div>
);
export const DemoBanner = () => <div className="demo-banner">Données de démonstration</div>;
export const Avatar = ({ text, large }) => <div className={`avatar${large ? ' large' : ''}`}>{text}</div>;
