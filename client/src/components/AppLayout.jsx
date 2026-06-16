import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import { Menu } from "lucide-react";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <main className="main-content">
        <header className="app-header">
          <button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={19} />
          </button>
          <GlobalSearch />
        </header>
        <Outlet />
      </main>
    </div>
  );
}
