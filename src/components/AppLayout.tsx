import { Outlet, Link } from "react-router-dom";
import { NavLink, Outlet } from "react-router-dom";
// ...
<NavLink to="/students" className="px-3 py-2 rounded hover:bg-gray-100">Students</NavLink>

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-semibold">School App</h1>
        <nav className="space-x-4 underline">
          <Link to="/">Dashboard</Link>
          <Link to="/groups">Groups</Link>
          <Link to="/import">Import</Link>
        </nav>
      </header>

      <main className="p-4">
        <Outlet /> {/* ← Routed pages render here */}
      </main>
    </div>
  );
}
