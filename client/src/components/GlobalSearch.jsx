import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function GlobalSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(location.pathname === "/search" ? params.get("q") || "" : "");

  useEffect(() => {
    if (location.pathname === "/search") setQuery(new URLSearchParams(location.search).get("q") || "");
  }, [location.pathname, location.search]);

  function submit(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  }

  return <form className="global-search" onSubmit={submit}>
    <Search size={18} />
    <input
      aria-label="Search entire shop"
      placeholder="Search customer, VIN, plate, order, service or DTC..."
      value={query}
      onChange={(event) => setQuery(event.target.value)}
    />
    {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>}
    <span>Enter</span>
  </form>;
}
