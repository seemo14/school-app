// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import { useState } from "react";

type Group = { id: string; name: string; grade: "8th" | "9th"; size: number };

const SAMPLE_GROUPS: Group[] = [
  { id: "2-1", name: "2ASCG1", grade: "8th", size: 32 },
  { id: "2-2", name: "2ASCG2", grade: "8th", size: 35 },
  { id: "2-3", name: "2ASCG3", grade: "8th", size: 34 },
  { id: "2-4", name: "2ASCG4", grade: "8th", size: 33 },
  { id: "2-5", name: "2ASCG5", grade: "8th", size: 31 },
  { id: "3-1", name: "3ASCG1", grade: "9th", size: 29 },
  { id: "3-2", name: "3ASCG2", grade: "9th", size: 30 },
  { id: "3-3", name: "3ASCG3", grade: "9th", size: 28 },
  { id: "3-4", name: "3ASCG4", grade: "9th", size: 27 },
];

export default function Dashboard() {
  const [query, setQuery] = useState("");
  const groups = SAMPLE_GROUPS.filter(g =>
    (g.name + g.grade).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Dashboard</h2>

      {/* Quick actions */}
      <section className="grid md:grid-cols-3 gap-4">
        <Card title="Add Marks">
          <p className="text-sm">Open a class and record Quiz / HW / Discipline / Participation / Final.</p>
          <div className="mt-3">
            <Link to="/groups" className="underline">Go to Groups →</Link>
          </div>
        </Card>

        <Card title="Import PDFs">
          <p className="text-sm">Upload students list or timetable PDFs. (OCR to be added later)</p>
          <div className="mt-3">
            <Link to="/import" className="underline">Open Import →</Link>
          </div>
        </Card>

        <Card title="Lesson Records">
          <p className="text-sm">Create a lesson record with: class, date/time, stages, notes.</p>
          <div className="mt-3">
            <Link to="/import" className="underline">Create a Record →</Link>
          </div>
        </Card>
      </section>

      {/* Groups table */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Your Groups</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search (e.g., 2ASCG3)"
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="overflow-x-auto border rounded-xl bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100">
              <tr>
                <Th>Group</Th>
                <Th>Grade</Th>
                <Th>Students</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id} className="border-t">
                  <Td className="font-medium">{g.name}</Td>
                  <Td>{g.grade}</Td>
                  <Td>{g.size}</Td>
                  <Td>
                    <Link to="/groups" className="underline">Open</Link>
                  </Td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <Td colSpan={4} className="text-center py-6 text-slate-500">
                    No groups match your search.
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h4 className="font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-slate-700">{children}</th>;
}
function Td({ children, className = "", colSpan }:
  { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td className={`px-4 py-3 ${className}`} colSpan={colSpan}>{children}</td>;
}
