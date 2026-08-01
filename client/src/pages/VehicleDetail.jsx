import { useEffect, useState } from "react";
import { Activity, ArrowLeft, CalendarDays, Camera, CarFront, FileUp, Gauge, Hash, Palette, Repeat2, TrendingUp, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const oilLabels = { current: "Current", due_soon: "Due soon", overdue: "Overdue" };

function readFile(file) {
  if (!file.type.startsWith("image/")) return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) return reject(new Error("Documents must be smaller than 5 MB."));
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", .78));
      };
      image.onerror = reject; image.src = reader.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });
}

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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get(`/vehicles/${id}`).then(({ data: response }) => setData(response)).catch((requestError) => setError(errorMessage(requestError)));
  }, [id]);

  if (!data && !error) return <div className="page"><Loading /></div>;
  async function upload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await readFile(file);
      const { data: attachment } = await api.post(`/vehicles/${id}/attachments`, { name: file.name, kind: file.type.startsWith("image/") ? "photo" : "document", url });
      setData({ ...data, vehicle: { ...data.vehicle, attachments: [...(data.vehicle.attachments || []), attachment] } });
    } catch (requestError) { setError(errorMessage(requestError)); } finally { setUploading(false); event.target.value = ""; }
  }

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
      <section className="vehicle-insight-grid">
        <article className="solid-panel"><header><TrendingUp /><div><h2>Mileage history</h2><p>Recorded changes from services and updates.</p></div></header><div className="mileage-series">{data.insights?.mileageHistory?.length ? data.insights.mileageHistory.slice(0, 8).map((entry, index) => <div key={`${entry.recordedAt}-${index}`}><i /><strong>{Number(entry.mileage).toLocaleString()} mi</strong><span>{new Date(entry.recordedAt).toLocaleDateString()} · {entry.source}</span></div>) : <Empty>No mileage history yet.</Empty>}</div></article>
        <article className="solid-panel"><header><Repeat2 /><div><h2>Recurring repairs</h2><p>Services appearing more than once.</p></div></header><div className="recurring-list">{data.insights?.recurringRepairs?.length ? data.insights.recurringRepairs.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.count}×</strong></div>) : <Empty>No recurring repair pattern detected.</Empty>}</div></article>
        <article className="solid-panel"><header><Activity /><div><h2>DTC history</h2><p>Previous diagnostic trouble codes.</p></div></header><div className="dtc-history">{data.insights?.dtcHistory?.length ? data.insights.dtcHistory.slice(0, 10).map((item, index) => <div key={`${item.code}-${index}`}><strong>{item.code}</strong><span>{item.description || "No description"}</span><small>{item.reportNumber} · {new Date(item.scanDate).toLocaleDateString()}</small></div>) : <Empty>No DTC history recorded.</Empty>}</div></article>
      </section>
      <section className="solid-panel vehicle-files">
        <header><Camera /><div><h2>Photos & files</h2><p>Vehicle photos, receipts, scanner reports and documents. Images are compressed before upload.</p></div><label className="button secondary"><FileUp />{uploading ? "Uploading..." : "Add file"}<input type="file" accept="image/*,.pdf" onChange={upload} disabled={uploading} hidden /></label></header>
        {data.vehicle.attachments?.length ? <div className="attachment-grid">{data.vehicle.attachments.map((file) => <a key={file._id} href={file.url} target="_blank" rel="noreferrer">{file.kind === "photo" ? <img src={file.url} alt={file.name} loading="lazy" decoding="async" /> : <FileUp />}<strong>{file.name}</strong><span>{file.kind}</span></a>)}</div> : <Empty>No photos or files uploaded yet.</Empty>}
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
