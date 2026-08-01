import { useEffect, useState } from "react";
import { AlertTriangle, Clock3, PackageSearch, Wrench, CheckCircle2 } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const labels = { scheduled: "Scheduled", check_in: "Check in", diagnosing: "Diagnosing", waiting_approval: "Waiting approval", waiting_parts: "Waiting parts", ready_to_start: "Ready to start", working: "In progress", quality_check: "Quality check", ready_pickup: "Ready for pickup", delivered: "Delivered" };
export default function WorkshopBoard() {
  const [data, setData] = useState(null); const [error, setError] = useState("");
  async function load() { try { setData((await api.get("/workshop")).data); } catch (e) { setError(errorMessage(e)); } }
  useEffect(() => { load(); const timer = setInterval(load, 60000); return () => clearInterval(timer); }, []);
  async function move(id, stage) { try { await api.put(`/workshop/${id}/stage`, { stage }); await load(); } catch (e) { setError(errorMessage(e)); } }
  if (!data) return <Loading />;
  return <div className="page business-module"><Alert message={error} onClose={() => setError("")} />
    <header className="module-hero"><div><span className="eyebrow">Live operations</span><h1>Workshop control board</h1><p>Move each repair through the shop and spot delays, approvals and parts blockers immediately.</p></div><div className="hero-count"><Wrench />{data.summary.active} active jobs</div></header>
    <section className="business-kpis"><article><Wrench /><span>Active repairs</span><strong>{data.summary.active}</strong></article><article className={data.summary.overdue ? "attention" : ""}><AlertTriangle /><span>Past promise</span><strong>{data.summary.overdue}</strong></article><article><PackageSearch /><span>Waiting parts</span><strong>{data.summary.waitingParts}</strong></article><article><CheckCircle2 /><span>Ready pickup</span><strong>{data.summary.ready}</strong></article></section>
    <section className="workshop-board">{data.stages.filter((stage) => stage !== "delivered").map((stage) => <article className="workshop-column" key={stage}><header><span>{labels[stage]}</span><b>{data.columns[stage]?.length || 0}</b></header><div>{data.columns[stage]?.map((order) => <section className="job-card" key={order._id}><strong>{order.orderNumber}</strong><h3>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "Vehicle"}</h3><p>{order.customer?.name}</p>{order.promisedAt && <small className={new Date(order.promisedAt) < new Date() ? "late" : ""}><Clock3 />{new Date(order.promisedAt).toLocaleString()}</small>}<select value={stage} onChange={(e) => move(order._id, e.target.value)}>{data.stages.map((value) => <option key={value} value={value}>{labels[value]}</option>)}</select></section>)}</div></article>)}</section>
  </div>;
}
