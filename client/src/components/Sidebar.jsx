import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Bot,
  CarFront,
  ClipboardList,
  CalendarClock,
  Activity,
  Cloud,
  FileText,
  LogOut,
  MonitorSmartphone,
  Search,
  UserRound,
  Wrench,
  LayoutGrid,
  BellRing,
  CalendarRange,
  PackageSearch,
  ShieldCheck,
  ClipboardCheck,
  BadgeDollarSign,
  UsersRound,
  KanbanSquare,
  ShoppingCart,
  ChartNoAxesCombined,
  Megaphone,
} from "lucide-react";

const groups = [
  {
    label: "Overview",
    links: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutGrid, permission: "dashboard" },
      { to: "/calendar", label: "Calendar", icon: CalendarRange, permission: "appointments" },
      { to: "/reminders", label: "Reminders", icon: BellRing, permission: "reminders" },
      { to: "/search", label: "Deep search", icon: Search },
    ],
  },
  {
    label: "Operations",
    links: [
      { to: "/appointments", label: "Appointments", icon: CalendarClock, permission: "appointments" },
      { to: "/customers", label: "Customers", icon: UserRound, permission: "customers" },
      { to: "/vehicles", label: "Vehicles", icon: CarFront, permission: "vehicles" },
      { to: "/estimates", label: "Estimates", icon: FileText, permission: "estimates" },
      { to: "/workshop", label: "Workflow", icon: KanbanSquare, permission: "work_orders" },
      { to: "/work-orders", label: "All work orders", icon: ClipboardList, permission: "work_orders" },
      { to: "/inventory", label: "Parts inventory", icon: PackageSearch, permission: "inventory" },
      { to: "/purchase-orders", label: "Purchase orders", icon: ShoppingCart, permission: "inventory" },
      { to: "/inspections", label: "Inspections", icon: ClipboardCheck, permission: "inspections" },
    ],
  },
  {
    label: "Diagnostics",
    links: [
      { to: "/scanner-reports", label: "Scanner reports", icon: Activity },
      { to: "/autel-import", label: "Autel import", icon: Cloud },
      { to: "/autel-live", label: "Autel live", icon: MonitorSmartphone },
      { to: "/assistant", label: "AI diagnostics", icon: Bot },
      { to: "/manuals", label: "Lemon Manuals", icon: Wrench },
    ],
  },
  {
    label: "Administration",
    links: [
      { to: "/finance", label: "Financial control", icon: BadgeDollarSign, permission: "finance" },
      { to: "/reports", label: "Reports & exports", icon: ChartNoAxesCombined, permission: "finance" },
      { to: "/marketing", label: "Marketing & reviews", icon: Megaphone, permission: "customers" },
      { to: "/technicians", label: "Mechanics & time", icon: UsersRound, permission: "technicians" },
      { to: "/security", label: "Security & audit", icon: ShieldCheck, adminOnly: true },
    ],
  },
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
      <div className="sidebar-workspace"><span>Workspace</span><strong>Service operations</strong></div>
      <nav className="sidebar-nav-groups">
        {groups.map((group) => <section className="sidebar-nav-group" key={group.label}>
          <div className="sidebar-kicker">{group.label}</div>
          {group.links.filter((link) => (!link.adminOnly || user?.role === "admin") && (user?.role === "admin" || !link.permission || user?.permissions?.includes(link.permission))).map((link) => {
            const Icon = link.icon;
            return <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
              <span className="nav-icon"><Icon size={17} strokeWidth={1.9} /></span>
              <span>{link.label}</span>
            </NavLink>;
          })}
        </section>)}
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
