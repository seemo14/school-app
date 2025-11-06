import { Outlet, Link } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header / Navbar */}
      <header className="p-4 border-b bg-white shadow-sm flex justify-between items-center">
        <h1 className="text-xl font-semibold">School App</h1>
        
        {/* Simple navigation */}
        <nav className="space-x-4">
          <Link className="hover:underline" to="/">Dashboard</Link>
          <Link className="hover:underline" to="/groups">Groups</Link>
          <Link className="hover:underline" to="/import">Import</Link>
        </nav>
      </header>

      {/* Page Content */}
      <main className="p-4">
        <Outlet /> {/* This is where routed pages appear */}
      </main>
    </div>
  );
}
