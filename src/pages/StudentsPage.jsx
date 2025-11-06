import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, deleteStudent, deleteMany } from "@/utils/dataService";

export default function StudentsPage() {
  const navigate = useNavigate();
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("fullName");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());

  useEffect(() => setAll(getStudents()), []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return all;
    return all.filter((r) =>
      (r.fullName || "").toLowerCase().includes(s) ||
      (r.classLevel || "").toLowerCase().includes(s)
    );
  }, [all, q]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const va = String(a[sortBy] ?? "").toLowerCase();
      const vb = String(b[sortBy] ?? "").toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortBy, sortDir]);

  const start = (page - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);

  useEffect(() => {
    const max = Math.max(1, Math.ceil(sorted.length / pageSize));
    if (page > max) setPage(max);
  }, [sorted.length, page, pageSize]);

  function refresh() {
    setAll(getStudents());
    setSelected(new Set());
  }

  function toggleAll(checked) {
    setSelected(checked ? new Set(rows.map((r) => r.id)) : new Set());
  }

  function toggleOne(id, checked) {
    const s = new Set(selected);
    checked ? s.add(id) : s.delete(id);
    setSelected(s);
  }

  function onDelete(id) {
    if (!confirm("Delete this student?")) return;
    deleteStudent(id);
    refresh();
  }

  function onBulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} selected student(s)?`)) return;
    deleteMany([...selected]);
    refresh();
  }

  function exportCSV() {
    const cols = ["id", "fullName", "classLevel", "gender", "dateAdded"];
    const data = sorted.map((r) => cols.map((c) => String(r[c] ?? "").replace(/"/g, '""')));
    const csv = [cols.join(","), ...data.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "students.csv" });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Students</h1>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by name or class…"
            className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                       placeholder:text-slate-400 border border-slate-300 dark:border-slate-700
                       rounded-lg px-3 py-2 min-w-64"
          />
          <button className="btn" onClick={refresh}>Reload</button>
          <button className="btn btn-primary" onClick={() => navigate("/students/new")}>+ Add Student</button>
          <button className="btn" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-danger disabled:opacity-50" disabled={selected.size===0} onClick={onBulkDelete}>
            Delete Selected
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm flex items-center gap-2">
          Sort by:
          <select
            className="select"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setSortDir("asc"); }}
          >
            <option value="fullName">Full Name</option>
            <option value="classLevel">Class / Level</option>
            <option value="gender">Gender</option>
            <option value="dateAdded">Date Added</option>
          </select>
        </label>
        <button className="btn" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
          {sortDir === "asc" ? "Asc ▲" : "Desc ▼"}
        </button>

        <label className="text-sm flex items-center gap-2 ml-auto">
          Per page:
          <select
            className="select"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm text-slate-900 dark:text-slate-100">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800">
              <th className="p-3 text-left">
                <input
                  type="checkbox"
                  checked={rows.length>0 && rows.every(r=>selected.has(r.id))}
                  onChange={(e) => toggleAll(e.target.checked)}
                />
              </th>
              <th className="p-3 text-left">Full Name</th>
              <th className="p-3 text-left">Class / Level</th>
              <th className="p-3 text-left">Gender</th>
              <th className="p-3 text-left">Date Added</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-slate-600 dark:text-slate-300" colSpan={6}>
                  No records found.
                </td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={(e)=>toggleOne(r.id, e.target.checked)}
                  />
                </td>
                <td className="p-3">{r.fullName}</td>
                <td className="p-3">{r.classLevel}</td>
                <td className="p-3">{r.gender || "—"}</td>
                <td className="p-3">{r.dateAdded}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="btn" onClick={() => navigate(`/students/${r.id}/edit`, { state: { student: r } })}>
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={()=>onDelete(r.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-3 text-sm">
        <div>
          Showing {rows.length ? (start+1) : 0}–{start + rows.length} of {sorted.length}
        </div>
        <div className="flex gap-2">
          <button className="btn disabled:opacity-50" disabled={page===1} onClick={()=>setPage(page-1)}>◀ Prev</button>
          <button className="btn disabled:opacity-50" disabled={start+pageSize>=sorted.length} onClick={()=>setPage(page+1)}>Next ▶</button>
        </div>
      </div>
    </div>
  );
}
