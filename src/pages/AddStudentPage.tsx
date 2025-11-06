import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addStudent } from "@/utils/dataService";

export default function AddStudentPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [gender, setGender] = useState("");
  const [dateAdded, setDateAdded] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || !classLevel.trim()) {
      setError("Full name and class/level are required.");
      return;
    }
    addStudent({ fullName: fullName.trim(), classLevel: classLevel.trim(), gender, dateAdded });
    navigate("/students");
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Add Student</h1>
      {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Full Name *</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., Amina El Fassi"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Class / Level *</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={classLevel}
            onChange={(e) => setClassLevel(e.target.value)}
            placeholder="e.g., 2nd Year (8th) or 3rd Year (9th)"
          />
          {/* If you prefer a dropdown, replace the input with:
          <select className="border rounded px-3 py-2 w-full" value={classLevel} onChange={(e)=>setClassLevel(e.target.value)}>
            <option value="">Select…</option>
            <option value="2nd Year / 8th Grade">2nd Year / 8th Grade</option>
            <option value="3rd Year / 9th Grade">3rd Year / 9th Grade</option>
          </select>
          */}
        </div>

        <div>
          <label className="block text-sm mb-1">Gender</label>
          <select
            className="border rounded px-3 py-2 w-full"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">—</option>
            <option>Female</option>
            <option>Male</option>
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1">Date Added</label>
          <input
            type="date"
            className="border rounded px-3 py-2 w-full"
            value={dateAdded}
            onChange={(e) => setDateAdded(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button type="submit" className="px-4 py-2 border rounded bg-black text-white">
            Save
          </button>
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => navigate("/students")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
