// Simple table with selectable rows and sortable headers
export default function Table({
  rows,
  columns,
  sortBy,
  sortDir,
  onSortChange,
  selectedIds,
  onToggleAll,
  onToggleOne,
  renderActions,
}) {
  function headerClick(accessor) {
    if (!onSortChange) return;
    if (sortBy === accessor) {
      onSortChange(accessor, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(accessor, "asc");
    }
  }

  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.has(r.id));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll?.(e.target.checked)}
              />
            </th>
            {columns.map((c) => (
              <th
                key={c.accessor}
                style={{ ...thStyle, cursor: "pointer", whiteSpace: "nowrap" }}
                onClick={() => headerClick(c.accessor)}
                title="Click to sort"
              >
                {c.header}{" "}
                {sortBy === c.accessor ? (sortDir === "asc" ? "▲" : "▼") : ""}
              </th>
            ))}
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 2} style={{ padding: 16, textAlign: "center", color: "#777" }}>
                No records found.
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={(e) => onToggleOne?.(r.id, e.target.checked)}
                  />
                </td>
                {columns.map((c) => (
                  <td key={c.accessor} style={tdStyle}>
                    {typeof c.cell === "function" ? c.cell(r) : r[c.accessor]}
                  </td>
                ))}
                <td style={tdStyle}>{renderActions?.(r)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 8px",
  fontWeight: 600,
  borderBottom: "1px solid #ddd",
  fontSize: 14,
};

const tdStyle = {
  padding: "10px 8px",
  fontSize: 14,
};
