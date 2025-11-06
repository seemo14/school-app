export default function Pagination({ page, pageSize, total, onPageChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < pages;

  function go(n) {
    if (n >= 1 && n <= pages) onPageChange?.(n);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button disabled={!canPrev} onClick={() => go(page - 1)}>
        ◀ Prev
      </button>
      <span style={{ fontSize: 12, color: "#555" }}>
        Page {page} / {pages} • {total} items
      </span>
      <button disabled={!canNext} onClick={() => go(page + 1)}>
        Next ▶
      </button>
    </div>
  );
}
