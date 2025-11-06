import { useState, useEffect } from "react";

export default function SearchBar({ value, onChange, placeholder = "Search by name or class…" }) {
  const [q, setQ] = useState(value ?? "");

  // keep local input synced with external value
  useEffect(() => setQ(value ?? ""), [value]);

  function submit(e) {
    e.preventDefault();
    onChange?.(q);
  }

  return (
    <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "8px 10px",
          border: "1px solid #ddd",
          borderRadius: 6,
        }}
      />
      <button
        type="submit"
        style={{
          padding: "8px 12px",
          border: "1px solid #222",
          background: "#222",
          color: "#fff",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </form>
  );
}
