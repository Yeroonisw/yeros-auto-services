import { useEffect, useMemo, useState } from "react";
import { CarFront, ClipboardList, FileText, Search, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function SearchResults() {
  const location = useLocation();
  const query = useMemo(() => new URLSearchParams(location.search).get("q") || "", [location.search]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    api.get("/search", { params: { q: query } })
      .then(({ data }) => setResults(data))
      .catch((requestError) => setError(errorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [query]);

  const count = results ? results.customers.length + results.vehicles.length + results.workOrders.length + results.estimates.length : 0;

  return <div className="page search-page">
    <div className="page-heading">
      <div><p className="eyebrow">Entire shop</p><h1>Deep search</h1><p>Search names, phones, VINs, plates, services, notes, estimates, orders and DTC codes.</p></div>
    </div>
    <Alert message={error} onClose={() => setError("")} />
    {!query && <div className="search-welcome"><Search size={34} /><h2>Search everything from the bar above</h2><p>Try a customer name, “P0300”, a VIN, license plate, repair description or order number.</p></div>}
    {query && query.length < 2 && <Empty>Enter at least two characters.</Empty>}
    {loading && <Loading />}
    {!loading && results && <div className="search-results">
      <div className="search-count"><strong>{count}</strong> results for “{query}”</div>
      {results.customers.length > 0 && <ResultGroup icon={UserRound} title="Customers">
        {results.customers.map((customer) => <Link className="search-result-card" to={`/customers/${customer._id}`} key={customer._id}>
          <div><strong>{customer.name}</strong><span>{customer.phone} · {customer.email || "No email"}</span></div><small>Customer</small>
        </Link>)}
      </ResultGroup>}
      {results.vehicles.length > 0 && <ResultGroup icon={CarFront} title="Vehicles">
        {results.vehicles.map((vehicle) => <Link className="search-result-card" to={`/vehicles/${vehicle._id}`} key={vehicle._id}>
          <div><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><span>{vehicle.customer?.name || "No customer"} · {vehicle.plate || "No plate"} · {vehicle.vin || "No VIN"}</span></div><small>Vehicle</small>
        </Link>)}
      </ResultGroup>}
      {results.workOrders.length > 0 && <ResultGroup icon={ClipboardList} title="Work orders">
        {results.workOrders.map((order) => <Link className="search-result-card" to={`/work-orders/${order._id}`} key={order._id}>
          <div><strong>{order.orderNumber} · {order.customer?.name}</strong><span>{order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model} · {order.services.map((item) => item.description).join(", ") || "No services"}</span></div><small>{money.format(order.total)}</small>
        </Link>)}
      </ResultGroup>}
      {results.estimates.length > 0 && <ResultGroup icon={FileText} title="Estimates">
        {results.estimates.map((estimate) => <Link className="search-result-card" to="/estimates" key={estimate._id}>
          <div><strong>{estimate.estimateNumber} · {estimate.customer?.name}</strong><span>{estimate.vehicle?.year} {estimate.vehicle?.make} {estimate.vehicle?.model} · {estimate.services.map((item) => item.description).join(", ") || "No services"}</span></div><small>{money.format(estimate.total)}</small>
        </Link>)}
      </ResultGroup>}
      {count === 0 && <Empty>No records matched “{query}”.</Empty>}
    </div>}
  </div>;
}

function ResultGroup({ icon: Icon, title, children }) {
  return <section className="search-group">
    <header><Icon size={18} /><h2>{title}</h2></header>
    <div>{children}</div>
  </section>;
}
