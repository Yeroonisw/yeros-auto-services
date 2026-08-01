import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CalendarClock, CarFront, ClipboardList, KanbanSquare, LogOut, Search, UserRound } from "lucide-react";

const groups = [
  {
    label: "Daily work",
    links: [
      { to: "/workshop", label: "Workflow", icon: KanbanSquare, permission: "work_orders" },
      { to: "/work-orders", label: "All work orders", icon: ClipboardList, permission: "work_orders" },
      { to: "/appointments", label: "Appointments", icon: CalendarClock, permission: "appointments" },
    ],
  },
  {
    label: "Records",
    links: [
      { to: "/customers", label: "Customers", icon: UserRound, permission: "customers" },
      { to: "/vehicles", label: "Vehicles", icon: CarFront, permission: "vehicles" },
      { to: "/search", label: "Search records", icon: Search },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  function signOut() { logout(); navigate("/login", { replace: true }); }
  return <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
    <div className="brand"><img src="/yeros-auto-logo.png" alt="Yeros Auto Services LLC" className="sidebar-logo" /></div>
    <div className="sidebar-workspace"><span>Essential workspace</span><strong>Orders & follow-up</strong></div>
    <nav className="sidebar-nav-groups">{groups.map((group) => <section className="sidebar-nav-group" key={group.label}><div className="sidebar-kicker">{group.label}</div>{group.links.filter((link) => user?.role === "admin" || !link.permission || user?.permissions?.includes(link.permission)).map((link) => { const Icon = link.icon; return <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}><span className="nav-icon"><Icon size={17} strokeWidth={1.9} /></span><span>{link.label}</span></NavLink>; })}</section>)}</nav>
    <div className="sidebar-footer"><div className="user-chip"><span>{user?.name?.slice(0, 1).toUpperCase()}</span><div><strong>{user?.name}</strong><small>{user?.email}</small></div></div><button className="logout-button" onClick={signOut}><LogOut size={15} />Sign out</button></div>
  </aside>;
}
