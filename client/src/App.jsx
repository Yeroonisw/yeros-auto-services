import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Customers from "./pages/Customers.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import WorkOrders from "./pages/WorkOrders.jsx";
import Estimates from "./pages/Estimates.jsx";
import Assistant from "./pages/Assistant.jsx";
import Manuals from "./pages/Manuals.jsx";
import WorkOrderDetail from "./pages/WorkOrderDetail.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import CustomerDetail from "./pages/CustomerDetail.jsx";
import VehicleDetail from "./pages/VehicleDetail.jsx";
import Home from "./pages/Home.jsx";
import ScannerReports from "./pages/ScannerReports.jsx";

function ProtectedRoute() {
  const { authenticated } = useAuth();
  return authenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
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
          <Route path="/estimates" element={<Estimates />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/manuals" element={<Manuals />} />
          <Route path="/search" element={<SearchResults />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
