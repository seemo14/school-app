import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {/* search example (forces readable colors) */}
        <input
          placeholder="Search (e.g., 2ASCG3)"
          className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
                     placeholder:text-slate-400 border border-slate-300 dark:border-slate-700
                     rounded-lg px-3 py-2 w-64"
        />
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card
          title="Add Marks"
          desc="Open a class and record Quiz / HW / Discipline / Participation / Final."
          linkTo="/groups"
          linkText="Go to Groups →"
        />
        <Card
          title="Import PDFs"
          desc="Upload students list or timetable PDFs. (OCR to be added later)"
          linkTo="/import"
          linkText="Open Import →"
        />
        <Card
          title="Lesson Records"
          desc="Create a lesson record with: class, date/time, stages, notes."
          linkTo="/records/new"
          linkText="Create a Record →"
        />
      </div>

      {/* Groups Table */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your Groups</h2>

        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm text-slate-900 dark:text-slate-100">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left p-3">Group</th>
                <th className="text-left p-3">Grade</th>
                <th className="text-left p-3">Students</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((r) => (
                <tr
                  key={r.group}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <td className="p-3">{r.group}</td>
                  <td className="p-3">{r.grade}</td>
                  <td className="p-3">{r.count}</td>
                  <td className="p-3">
                    <Link
                      to={`/groups/${r.group}`}
                      className="underline text-slate-900 dark:text-slate-100"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  desc,
  linkTo,
  linkText,
}: {
  title: string;
  desc: string;
  linkTo: string;
  linkText: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{desc}</p>
      <Link
        to={linkTo}
        className="mt-3 inline-block font-medium underline text-slate-900 dark:text-slate-100"
      >
        {linkText}
      </Link>
    </div>
  );
}

const SAMPLE_ROWS = [
  { group: "2ASCG1", grade: "8th", count: 32 },
  { group: "2ASCG2", grade: "8th", count: 35 },
  { group: "2ASCG3", grade: "8th", count: 34 },
  { group: "2ASCG4", grade: "8th", count: 33 },
  { group: "2ASCG5", grade: "8th", count: 31 },
];
