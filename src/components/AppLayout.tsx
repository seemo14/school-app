import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar (mobile: off-canvas) */}
      <aside
        className={[
          "fixed z-40 inset-y-0 left-0 w-64 bg-white border-r shadow-sm transform transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:shadow-none",
        ].join(" ")}
        aria-label="Sidebar"
      >
        {/* Brand */}
        <div className="h-14 flex items-center px-4 border-b">
          <span className="font-semibold">🏫 School App</span>
        </div>

        {/* Nav */}
        <nav className="p-2 space-y-1">
          <NavItem to="/" label="Dashboard" emoji="🏠" onNavigate={() => setOpen(false)} />
          <NavItem to="/students" label="Students" emoji="👩‍🎓" onNavigate={() => setOpen(false)} />
          <NavItem to="/import" label="Import" emoji="⬆️" onNavigate={() => setOpen(false)} />
          {/* <NavItem to="/groups" label="Groups" emoji="👥" onNavigate={() => setOpen(false)} /> */}
        </nav>
      </aside>

      {/* Page column */}
      <div className="flex-1 min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="h-14 bg-white border-b flex items-center gap-3 px-4 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded hover:bg-slate-100"
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            {/* hamburger */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="font-semibold">Dashboard</div>
          <div className="ml-auto text-sm text-slate-500">
            {/* Put user/status actions here */}
          </div>
        </header>

        {/* Content */}
        <main className="p-4">
          <Outlet />
        </main>
      </div>

      {/* Backdrop for mobile sidebar */}
      {open && (
        <button
          className="fixed inset-0 bg-black/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}

type NavItemProps = {
  to: string;
  label: string;
  emoji?: string;
  onNavigate?: () => void;
};

function NavItem({ to, label, emoji, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        [
          "flex items-center gap-2 px-3 py-2 rounded-md",
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
      onClick={onNavigate}
    >
      <span className="w-5 text-center">{emoji}</span>
      <span>{label}</span>
    </NavLink>
  );
}

