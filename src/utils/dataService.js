// Simple localStorage-backed data layer for students
const KEY = "students";

// Normalize imported data to a standard shape
function normalizeStudent(raw, idx = Date.now()) {
  return {
    id: raw.id ?? `${idx}-${Math.random().toString(36).slice(2, 8)}`,
    fullName:
      raw.fullName ??
      raw.name ??
      [raw.firstName, raw.lastName].filter(Boolean).join(" ") ??
      "",
    classLevel: raw.classLevel ?? raw.class ?? raw.level ?? "",
    gender: raw.gender ?? "",
    dateAdded: raw.dateAdded ?? new Date().toISOString().slice(0, 10),
    // keep any extra fields the import may have
    ...raw,
  };
}

export function getStudents() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    // ensure all records are normalized (in case Import saved custom headers)
    return raw.map((s, i) => normalizeStudent(s, i));
  } catch {
    return [];
  }
}

export function setStudents(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addStudent(student) {
  const list = getStudents();
  const toAdd = normalizeStudent(student);
  list.push(toAdd);
  setStudents(list);
  return toAdd;
}

export function updateStudent(id, patch) {
  const list = getStudents();
  const idx = list.findIndex((s) => s.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...patch };
    setStudents(list);
    return list[idx];
  }
  return null;
}

export function deleteStudent(id) {
  const list = getStudents().filter((s) => s.id !== id);
  setStudents(list);
}

export function deleteMany(ids = []) {
  const setIds = new Set(ids);
  const list = getStudents().filter((s) => !setIds.has(s.id));
  setStudents(list);
}

export function clearAllStudents() {
  localStorage.setItem(KEY, "[]");
}
