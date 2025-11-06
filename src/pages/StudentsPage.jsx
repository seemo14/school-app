import { useMemo, useState, useEffect } from "react";
import Table from "../components/Table.jsx";
import SearchBar from "../components/SearchBar.jsx";
import Pagination from "../components/Pagination.jsx";
import {
  getStudents,
  setStudents,
  deleteStudent,
  deleteMany,
} from "../utils/dataService.js";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function StudentsPage() {
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Load once on mount
  useEffect(() => {
    setAll(getStudents());
  }, []);

  // When Import page adds new data elsewhere, allow manual refresh
  function refresh() {
    setAll(getStudents());
    setSelectedIds(new Set());
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((s) => {
      return (
        (s.fullName || "").toLowerCase().includes(q) ||
        (s.classLevel || "").toLowerCase().includes(q)
      );
    });
  }, [all, query]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      const va = (a[sortBy] ?? "").toString().toLowerCase();
      const vb = (b[sortBy] ?? "").toString().toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filtered, sortBy, sortDir]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // Keep page in range if filtering shrinks results
  useEffect(() => {
    const maxPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    if (page > maxPages) setPage(maxPages);
  }, [sorted.length, page, pageSize]);

  function onSortChange(by, dir) {
    setSortBy(by);
    setSortDir(dir);
  }

  function toggleAll(checked) {
    if (!checked) return setSelectedIds(new Set());
    setSelectedIds(new Set(paged.map((r) => r.id)));
  }

  function toggleOne(id, checked) {
    const copy = new Set(selectedIds);
    if (checked) copy.add(id);
    else copy.delete(id);
    setSelectedIds(copy);
  }

  function handleDelete(id) {
    if (!confirm("Delete this student?")) return;
    deleteStudent(id);
    refresh();
  }

  function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected student(s)?`)) return;
    deleteMany([...selectedIds]);
    refresh();
  }

  function handleEdit(row) {
    // Navigate to your Edit page (to be implemented next)
    navigate(`/students/${row.id}/edit`, { state: { student: row } });
  }

  function handleAdd() {
    navigate("/students/new");
  }

  function handleExportCSV() {
    const cols = ["id", "fullName", "classLevel", "gender", "dateAdded"];
    const rows = sorted.map((r) => cols.map((c) => `${(r[c] ?? "").toString().replace(/"/g, '""')}`));
    const csv =
      [cols.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClearAll() {
    if (!confirm("This will remove ALL students. Continue?")) return;
    setStudents([]);
    refresh();
  }

  const columns = [
    { header: "Full Name", accessor: "fullName" },
    { header: "Class / Level", accessor: "classLevel" },
    { header: "Gender", accessor: "gender" },
    { header: "Date Added", accessor: "dateAdded" },
  ];

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Students</h1>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <SearchBar value={query} onChange={(v) => { setQuery(v); setPage(1); }} />
        <button onClick={refresh} title="Reload data">Reload</button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleAdd} style={btnPrimary}>+ Add Student</button>
          <button onClick={handleExportCSV}>Export CSV</button>
          <button onClick={handleBulkDelete} disabled={selectedIds.size === 0}>
            Delete Selected
          </button>
          <button onClick={handleClearAll} style={{ color: "#b00020" }}>
            Clear All
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 12 }}>Sort by:</span>
          <select value={sortBy} onChange={(e) => onSortChange(e.target.value, "asc")}>
            <option value="fullName">Full Name</option>
            <option value="classLevel">Class / Level</option>
            <option value="gender">Gender</option>
            <option value="dateAdded">Date Added</option>
          </select>
        </label>
        <button onClick={() => onSortChange(sortBy, sortDir === "asc" ? "desc" : "asc")}>
          {sortDir === "asc" ? "Asc ▲" : "Desc ▼"}
        </button>

        <label style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          <span style={{ fontSize: 12 }}>Per page:</span>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <Table
        rows={paged}
        columns={columns}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        selectedIds={selectedIds}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        renderActions={(row) => (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleEdit(row)}>Edit</button>
            <button onClick={() => handleDelete(row.id)} style={{ color: "#b00020" }}>
              Delete
            </button>
          </div>
        )}
      />

      <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 12, color: "#666" }}>
          Showing {(paged.length && (page - 1) * pageSize + 1) || 0}–
          {(page - 1) * pageSize + paged.length} of {sorted.length}
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

const btnPrimary = {
  background: "#222",
  color: "#fff",
  border: "1px solid #222",
  padding: "8px 12px",
  borderRadius: 6,
  cursor: "pointer",
};
