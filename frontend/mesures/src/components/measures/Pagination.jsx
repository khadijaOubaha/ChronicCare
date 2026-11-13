export default function Pagination({ page, totalPages, total, onChange }) {
  if (!total) return null;
  return (
    <div className="pagination">
      <span>{total} mesure{total > 1 ? 's' : ''} · page {page} / {Math.max(totalPages, 1)}</span>
      <div>
        <button className="btn-light" disabled={page <= 1} onClick={() => onChange(page - 1)}>Précédent</button>
        <button className="btn-light" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Suivant</button>
      </div>
    </div>
  );
}
