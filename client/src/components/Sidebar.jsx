import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Bot,
  CarFront,
  ClipboardList,
  Activity,
  Cloud,
  FileText,
  Gauge,
  LogOut,
  MonitorSmartphone,
  Search,
  UserRound,
  Wrench,
} from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: Gauge },
  { to: "/search", label: "Deep search", icon: Search },
  { to: "/customers", label: "Customers", icon: UserRound },
  { to: "/vehicles", label: "Vehicles", icon: CarFront },
  { to: "/estimates", label: "Estimates", icon: FileText },
  { to: "/work-orders", label: "Work orders", icon: ClipboardList },
  { to: "/scanner-reports", label: "Scanner reports", icon: Activity },
  { to: "/autel-import", label: "Autel import", icon: Cloud },
  { to: "/autel-live", label: "Autel live", icon: MonitorSmartphone },
  { to: "/assistant", label: "AI diagnostics", icon: Bot },
  { to: "/manuals", label: "Lemon Manuals", icon: Wrench },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <img src="/yeros-auto-logo.png" alt="Yeros Auto Services LLC" className="sidebar-logo" />
      </div>
      <nav>
        {links.map((link) => {
          const Icon = link.icon;
          return (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="nav-icon"><Icon size={17} strokeWidth={1.9} /></span>
            {link.label}
          </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="user-chip">
          <span>{user?.name?.slice(0, 1).toUpperCase()}</span>
          <div>
            <strong>{user?.name}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
        <button className="logout-button" onClick={signOut}><LogOut size={15} /> Sign out</button>
      </div>
    </aside>
  );
}
