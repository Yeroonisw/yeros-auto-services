import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
import { CalendarPlus, Download, FilePlus2, Menu, Plus, UserPlus } from "lucide-react";

const pageNames = {
  dashboard: ["Dashboard", "Overview of your shop"],
  customers: ["Customers", "Customer records and service history"],
  vehicles: ["Vehicles", "Garage, mileage and maintenance"],
  "work-orders": ["Work orders", "Repairs, labor and invoices"],
  estimates: ["Estimates", "Quotes and approvals"],
  appointments: ["Appointments", "Schedule and service requests"],
  search: ["Deep search", "Find anything across the shop"],
  "scanner-reports": ["Scanner reports", "Diagnostic scans and DTC codes"],
  "autel-import": ["Autel import", "Import diagnostic reports"],
  "autel-live": ["Autel live", "Live diagnostic workspace"],
  assistant: ["AI diagnostics", "Diagnostic support assistant"],
  manuals: ["Lemon Manuals", "Repair information workspace"],
  inspections: ["Inspections", "Digital vehicle condition reports"],
  finance: ["Financial control", "Sales, expenses and real net profit"],
  technicians: ["Mechanics & time", "Assignments, hours and productivity"],
  workshop: ["Workflow", "Move repairs through the shop"],
  "purchase-orders": ["Purchase orders", "Suppliers, deliveries and receiving"],
  reports: ["Reports & exports", "Accounting-ready business data"],
  marketing: ["Marketing & reviews", "Retention, reputation and offers"],
};

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const location = useLocation();
  const segment = location.pathname.split("/").filter(Boolean)[0] || "dashboard";
  const [title, subtitle] = pageNames[segment] || ["Workspace", "Yeros Auto Services"];
  useEffect(() => {
    const capture = (event) => { event.preventDefault(); setInstallPrompt(event); };
    window.addEventListener("beforeinstallprompt", capture);
    return () => window.removeEventListener("beforeinstallprompt", capture);
  }, []);
  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    setInstallPrompt(null);
  }
  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    if (permission === "granted") new Notification("Yeros notifications enabled", { body: "You can now receive shop alerts on this device.", icon: "/yeros-auto-logo.png" });
  }

  return (
    <div className="app-shell admin-v2 fresh-admin">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      {open && <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close menu" />}
      <main className="main-content">
        <header className="app-header">
          <button className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu size={19} />
          </button>
          <div className="header-page-context">
            <span>Yeros workspace</span>
            <strong>{title}</strong>
            <small>{subtitle}</small>
          </div>
          <GlobalSearch />
          {installPrompt && <button className="header-install-button" onClick={installApp}><Download />Install app</button>}
          {"Notification" in window && Notification.permission === "default" && <button className="header-install-button" onClick={enableNotifications}>Enable alerts</button>}
          <div className="header-quick-wrap">
            <button className="header-quick-button" onClick={() => setQuickOpen(!quickOpen)} aria-expanded={quickOpen}>
              <Plus size={17} /> <span>Quick create</span>
            </button>
            {quickOpen && <div className="header-quick-menu">
              <Link to="/customers" onClick={() => setQuickOpen(false)}><UserPlus /><span><strong>New customer</strong><small>Add contact and vehicle</small></span></Link>
              <Link to="/work-orders" onClick={() => setQuickOpen(false)}><FilePlus2 /><span><strong>Work order</strong><small>Start a new repair</small></span></Link>
              <Link to="/appointments" onClick={() => setQuickOpen(false)}><CalendarPlus /><span><strong>Appointment</strong><small>Schedule service</small></span></Link>
            </div>}
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
