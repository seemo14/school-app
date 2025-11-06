import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

export default function AppLayout() {
  const [open, setOpen] = useState(false); // mobile drawer
  const [dark, setDark] = useState(false);
  const { pathname } = useLocation();

  // dark mode (optional)
  useEffect(() => {
    const saved = localStorage.getItem("theme-dark") === "1";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme-dark", next ? "1" : "0");
  }

  // close drawer on route change
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200/70 dark:border-slate-800 flex items-center px-3 gap-2">
        <button
          className="lg:hidden p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Hamburger />
        </button>
        <div className="font-semibold truncate">Dashboard</div>
        <div className="ml-auto flex items-center gap-2">
          <button
            className="px-3 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={toggleTheme}
            title="Toggle dark mode"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 shadow-sm transform transition-transform duration-200",
            open ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0 lg:static lg:shadow-none",
          ].join(" ")}
        >
          <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
            <span className="font-semibold">🏫 School App</span>
          </div>

          <nav className="p-2">
            <SideLink to="/" end icon={<HomeIcon />}>Dashboard</SideLink>
            <SideLink to="/students" icon={<UsersIcon />}>Students</SideLink>
            <SideLink to="/import" icon={<ImportIcon />}>Import</SideLink>
          </nav>
        </aside>

        {/* Backdrop for mobile */}
        {open && (
          <button
            className="fixed inset-0 bg-black/30 lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
        )}

        {/* Page content */}
        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SideLink({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
  [
    "group flex items-center gap-3 px-3 py-2 rounded-md mb-1 font-medium",
    isActive
      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
      : "text-slate-800 hover:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800",
  ].join(" ")
}

    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
      <span
        className={[
          "ml-auto h-5 w-1.5 rounded-full bg-slate-300 opacity-0",
          "group-[.active]:opacity-100",
        ].join(" ")}
      />
    </NavLink>
  );
}

/* --- tiny inline icons (no extra deps) --- */
function Hamburger() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M3 10.5 12 4l9 6.5V20a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2v-9.5Z" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M12 3v12m0 0 3.5-3.5M12 15l-3.5-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="15" width="18" height="6" rx="2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
