import { useEffect, useState } from "react";
import { ArrowLeft, CarFront, ClipboardList, FileText, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data: response }) => setData(response)).catch((requestError) => setError(errorMessage(requestError)));
  }, [id]);

  if (!data && !error) return <div className="page"><Loading /></div>;
  const totalSpent = data?.orders.filter((order) => order.status === "completed").reduce((sum, order) => sum + order.total, 0) || 0;

  return <div className="page">
    <Alert message={error} onClose={() => setError("")} />
    {data && <>
      <div className="detail-topbar"><Link className="back-link" to="/customers"><ArrowLeft size={17} /> Customers</Link></div>
      <section className="detail-hero customer-hero">
        <div><p className="eyebrow">Customer profile</p><h1>{data.customer.name}</h1><p>Customer since {new Date(data.customer.createdAt).toLocaleDateString()}</p></div>
        <UserRound size={46} strokeWidth={1.4} />
      </section>
      <section className="detail-summary-grid">
        <article><Phone /><span>Phone</span><strong>{data.customer.phone}</strong></article>
        <article><Mail /><span>Email</span><strong>{data.customer.email || "Not recorded"}</strong></article>
        <article><MapPin /><span>Address</span><strong>{data.customer.address || "Not recorded"}</strong></article>
        <article><ClipboardList /><span>Completed spend</span><strong>{money.format(totalSpent)}</strong><small>Customer charges including tax</small></article>
      </section>
      <div className="profile-grid">
        <section className="panel profile-section">
          <div className="panel-heading"><h2><CarFront size={18} /> Vehicles</h2><p>{data.vehicles.length} registered vehicles.</p></div>
          {data.vehicles.length ? <div className="profile-list">{data.vehicles.map((vehicle) => <Link to={`/vehicles/${vehicle._id}`} key={vehicle._id}>
            <div><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><span>{vehicle.plate || "No plate"} · {vehicle.vin || "No VIN"}</span></div><small>{Number(vehicle.mileage || 0).toLocaleString()} mi</small>
          </Link>)}</div> : <Empty>No vehicles registered.</Empty>}
        </section>
        <section className="panel profile-section">
          <div className="panel-heading"><h2><FileText size={18} /> Estimates</h2><p>Quotes prepared for this customer.</p></div>
          {data.estimates.length ? <div className="profile-list">{data.estimates.map((estimate) => <Link to="/estimates" key={estimate._id}>
            <div><strong>{estimate.estimateNumber}</strong><span>{estimate.vehicle ? `${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model}` : "-"} · {estimate.status}</span></div><small>{money.format(estimate.total)}</small>
          </Link>)}</div> : <Empty>No estimates recorded.</Empty>}
        </section>
      </div>
      <section className="panel profile-section profile-orders">
        <div className="panel-heading"><h2><ClipboardList size={18} /> Repair history</h2><p>All work orders for this customer.</p></div>
        {data.orders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Vehicle</th><th>Services</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>{data.orders.map((order) => <tr key={order._id}><td><Link className="record-link" to={`/work-orders/${order._id}`}>{order.orderNumber}</Link></td><td>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "-"}</td><td>{order.services.map((item) => item.description).join(", ") || "-"}</td><td><span className={`status ${order.status}`}>{order.status.replace("_", " ")}</span></td><td>{money.format(order.total)}</td></tr>)}</tbody>
        </table></div> : <Empty>No repairs recorded.</Empty>}
      </section>
      {data.customer.notes && <section className="panel profile-notes"><div className="panel-heading"><h2>Customer notes</h2></div><p>{data.customer.notes}</p></section>}
    </>}
  </div>;
}
