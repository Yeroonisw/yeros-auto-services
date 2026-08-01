import { Component, lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import { business } from "./config/business.js";

const Customers = lazy(() => import("./pages/Customers.jsx"));
const Vehicles = lazy(() => import("./pages/Vehicles.jsx"));
const WorkOrders = lazy(() => import("./pages/WorkOrders.jsx"));
const Appointments = lazy(() => import("./pages/Appointments.jsx"));
const AppointmentDetail = lazy(() => import("./pages/AppointmentDetail.jsx"));
const WorkOrderDetail = lazy(() => import("./pages/WorkOrderDetail.jsx"));
const SearchResults = lazy(() => import("./pages/SearchResults.jsx"));
const CustomerDetail = lazy(() => import("./pages/CustomerDetail.jsx"));
const VehicleDetail = lazy(() => import("./pages/VehicleDetail.jsx"));
const PublicInspection = lazy(() => import("./pages/PublicInspection.jsx"));
const CustomerPortal = lazy(() => import("./pages/CustomerPortal.jsx"));
const WorkshopBoard = lazy(() => import("./pages/WorkshopBoard.jsx"));

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
    <Suspense fallback={<div className="route-loading"><span /><p>Loading workspace...</p></div>}><Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/portal" element={<CustomerPortal />} />
      <Route path="/inspection/:token" element={<PublicInspection />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Navigate to="/workshop" replace />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/appointments/:id" element={<AppointmentDetail />} />
          <Route path="/workshop" element={<WorkshopBoard />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Suspense>
    </AppErrorBoundary>
  );
}
