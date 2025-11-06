import { Routes, Route, Link, useLocation } from "react-router-dom";

export default function App() {
  const loc = useLocation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">App mounted ✅</h1>
      <p className="mt-2">location: <code>{loc.pathname}</code></p>

      <nav className="mt-4 space-x-4 underline">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>

      <div className="mt-6">
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
          <Route path="*" element={<div>Unknown route (no match)</div>} />
        </Routes>
      </div>
    </div>
  );
}
