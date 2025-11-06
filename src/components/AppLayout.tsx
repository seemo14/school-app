import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-semibold">School App</h1>

        {/* ✅ Replace Link with NavLink */}
        <nav className="space-x-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "font-bold underline" : "hover:underline"
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/students"
            className={({ isActive }) =>
              isActive ? "font-bold underline" : "hover:underline"
            }
          >
            Students
          </NavLink>

          <NavLink
            to="/import"
            className={({ isActive }) =>
              isActive ? "font-bold underline" : "hover:underline"
            }
          >
            Import
          </NavLink>
        </nav>
      </header>

      <main className="p-4">
        <Outlet /> {/* Routed pages render here */}
      </main>
    </div>
  );
}
