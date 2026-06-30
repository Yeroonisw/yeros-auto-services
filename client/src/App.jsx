import { Component } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Customers from "./pages/Customers.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import WorkOrders from "./pages/WorkOrders.jsx";
import Estimates from "./pages/Estimates.jsx";
import Appointments from "./pages/Appointments.jsx";
import AppointmentDetail from "./pages/AppointmentDetail.jsx";
import Assistant from "./pages/Assistant.jsx";
import Manuals from "./pages/Manuals.jsx";
import WorkOrderDetail from "./pages/WorkOrderDetail.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import Home from "./pages/Home.jsx";
import ScannerReports from "./pages/ScannerReports.jsx";
import ScannerReportDetail from "./pages/ScannerReportDetail.jsx";
import AutelImport from "./pages/AutelImport.jsx";
import AutelLive from "./pages/AutelLive.jsx";
import { business } from "./config/business.js";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("App render failed", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return <div className="public-site fallback-site">
      <main className="fallback-panel">
        <img src="/yeros-auto-logo.png" alt={business.name} />
        <h1>Yeros Auto Services LLC</h1>
        <p>Mobile mechanic service available 24/7. If this page did not load correctly, call or message us directly.</p>
        <div className="hero-actions">
          <a className="public-button red" href={"tel:" + business.phone}>Call {business.phoneDisplay}</a>
          <a className="public-button whatsapp" href={"https://wa.me/" + business.whatsapp}>WhatsApp</a>
        </div>
      </main>
    </div>;
  }
}

function ProtectedRoute() {
  const { authenticated } = useAuth();
  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppErrorBoundary>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="/scanner-reports" element={<ScannerReports />} />
          <Route path="/scanner-reports/:id" element={<ScannerReportDetail />} />
          <Route path="/autel-import" element={<AutelImport />} />
          <Route path="/autel-live" element={<AutelLive />} />
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/manuals" element={<Manuals />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AppErrorBoundary>
  );
}
