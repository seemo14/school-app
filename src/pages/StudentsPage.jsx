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
    setSelecte
