import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CarFront, Gauge, Hash, Palette, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const oilLabels = { current: "Current", due_soon: "Due soon", overdue: "Overdue" };

function oilHelper(vehicle) {
  const status = vehicle.oilChangeStatus;
  if (!status?.nextMileage) return "Add the last oil change mileage to start tracking.";
  if (status.status === "overdue") return `${Math.abs(Number(status.milesRemaining || 0)).toLocaleString()} miles overdue`;
  return `${Number(status.milesRemaining || 0).toLocaleString()} miles remaining`;
}

export default function VehicleDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(({ data: response }) => setData(response)).catch((requestError) => setError(errorMessage(requestError)));
  }, [id]);

  if (!data && !error) return <div className="page"><Loading /></div>;

  return <div className="page">
    <Alert message={error} onClose={() => setError("")} />
    {data && <>
      <div className="detail-topbar"><Link className="back-link" to="/vehicles"><ArrowLeft size={17} /> Vehicles</Link></div>
      <section className="detail-hero vehicle-hero">
        <div><p className="eyebrow">Vehicle profile</p><h1>{data.vehicle.year} {data.vehicle.make} {data.vehicle.model}</h1><p>Owned by <Link to={`/customers/${data.vehicle.customer?._id}`}>{data.vehicle.customer?.name}</Link></p></div>
        <CarFront size={54} strokeWidth={1.4} />
      </section>
      <section className="detail-summary-grid">
        <article><Hash /><span>VIN</span><strong>{data.vehicle.vin || "Not recorded"}</strong></article>
        <article><CarFront /><span>License plate</span><strong>{data.vehicle.plate || "Not recorded"}</strong><small>{data.vehicle.engine || "Engine not recorded"}</small></article>
        <article><Gauge /><span>Mileage</span><strong>{Number(data.vehicle.mileage || 0).toLocaleString()} mi</strong></article>
        <article><Palette /><span>Color</span><strong>{data.vehicle.color || "Not recorded"}</strong></article>
      </section>
      <section className={`oil-change-card ${data.vehicle.oilChangeStatus?.status || "current"}`}>
        <Gauge size={24} />
        <div>
          <span>Oil change tracking</span>
          <h2>{oilLabels[data.vehicle.oilChangeStatus?.status] || "Not set"}</h2>
          <p>{oilHelper(data.vehicle)}</p>
        </div>
        <div className="oil-change-meta">
          <small>Last service</small>
          <strong>{data.vehicle.oilChange?.lastMileage ? `${Number(data.vehicle.oilChange.lastMileage).toLocaleString()} mi` : "Not set"}</strong>
          <small>Next due</small>
          <strong>{data.vehicle.oilChangeStatus?.nextMileage ? `${Number(data.vehicle.oilChangeStatus.nextMileage).toLocaleString()} mi` : "Not set"}</strong>
          <small>Date target</small>
          <strong>{data.vehicle.oilChangeStatus?.nextDate ? new Date(data.vehicle.oilChangeStatus.nextDate).toLocaleDateString() : "Not set"}</strong>
        </div>
      </section>
      <section className="panel profile-section">
        <div className="panel-heading"><h2>Oil change history</h2><p>Every oil change saved from work orders.</p></div>
        {data.vehicle.oilChangeHistory?.length ? <div className="oil-history-list">
          {data.vehicle.oilChangeHistory.map((entry, index) => <article key={`${entry.workOrder || index}-${entry.mileage}`}>
            <div>
              <strong>{Number(entry.mileage || 0).toLocaleString()} mi</strong>
              <span>{entry.serviceDate ? new Date(entry.serviceDate).toLocaleDateString() : "No date"} · Next {Number((entry.mileage || 0) + (entry.intervalMiles || 0)).toLocaleString()} mi</span>
              {entry.notes && <p>{entry.notes}</p>}
            </div>
            {entry.workOrder ? <Link to={`/work-orders/${entry.workOrder}`}>{entry.orderNumber || "Work order"}</Link> : <small>Manual entry</small>}
          </article>)}
        </div> : <Empty>No oil change history yet.</Empty>}
      </section>
      <section className="owner-card">
        <UserRound size={20} />
        <div><span>Owner</span><Link to={`/customers/${data.vehicle.customer?._id}`}>{data.vehicle.customer?.name}</Link><small>{data.vehicle.customer?.phone} · {data.vehicle.customer?.email || "No email"}</small></div>
      </section>
      <section className="panel profile-section profile-orders">
        <div className="panel-heading"><h2><CalendarDays size={18} /> Repair timeline</h2><p>Service history, diagnostic codes and totals.</p></div>
        {data.orders.length ? <div className="vehicle-timeline">{data.orders.map((order) => <article key={order._id}>
          <div className="timeline-date"><strong>{new Date(order.openedAt).toLocaleDateString()}</strong><span>{order.status.replace("_", " ")}</span></div>
          <div className="timeline-body"><Link to={`/work-orders/${order._id}`}>{order.orderNumber}</Link><h3>{order.services.map((item) => item.description).join(", ") || "No services recorded"}</h3>
            {order.dtcCodes?.length > 0 && <div className="timeline-dtc">{order.dtcCodes.map((dtc) => <span key={dtc.code}>{dtc.code}</span>)}</div>}
            {order.notes && <p>{order.notes}</p>}
          </div>
          <strong className="timeline-total">{money.format(order.total)}</strong>
        </article>)}</div> : <Empty>No repairs recorded for this vehicle.</Empty>}
      </section>
      <section className="panel profile-section">
        <div className="panel-heading"><h2>Scanner reports</h2><p>Autel scan history and diagnostic trouble codes.</p></div>
        {data.scannerReports?.length ? <div className="vehicle-timeline scanner-timeline">{data.scannerReports.map((report) => <article key={report._id}>
          <div className="timeline-date"><strong>{new Date(report.scanDate).toLocaleDateString()}</strong><span>{report.scannerModel}</span></div>
          <div className="timeline-body"><h3>{report.reportNumber}</h3>
            {report.dtcCodes?.length > 0 && <div className="timeline-dtc">{report.dtcCodes.map((dtc, index) => <span key={`${dtc.code}-${index}`}>{dtc.code}</span>)}</div>}
            {report.summary && <p>{report.summary}</p>}
          </div>
          <strong className="timeline-total">{Number(report.mileage || 0).toLocaleString()} mi</strong>
        </article>)}</div> : <Empty>No scanner reports recorded for this vehicle.</Empty>}
      </section>
      <section className="panel profile-section">
        <div className="panel-heading"><h2>Estimates</h2><p>Quotes associated with this vehicle.</p></div>
        {data.estimates.length ? <div className="profile-list">{data.estimates.map((estimate) => <Link to="/estimates" key={estimate._id}><div><strong>{estimate.estimateNumber}</strong><span>{estimate.status} · {new Date(estimate.createdAt).toLocaleDateString()}</span></div><small>{money.format(estimate.total)}</small></Link>)}</div> : <Empty>No estimates recorded.</Empty>}
      </section>
    </>}
  </div>;
}
