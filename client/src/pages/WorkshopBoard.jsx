import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CarFront, CheckCircle2, ChevronRight, Clock3, Columns3, List, PackageSearch, Plus, Search, UserRound, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const stageLabels = { scheduled: "Scheduled", check_in: "Check in", diagnosing: "Diagnosing", waiting_approval: "Waiting approval", waiting_parts: "Waiting parts", ready_to_start: "Ready to start", working: "In progress", quality_check: "Quality check", ready_pickup: "Ready for pickup", delivered: "Delivered" };
const groups = [
  { id: "incoming", label: "Incoming", color: "blue", stages: ["scheduled", "check_in", "diagnosing"] },
  { id: "approval", label: "Approval", color: "amber", stages: ["waiting_approval"] },
  { id: "parts", label: "Parts", color: "violet", stages: ["waiting_parts", "ready_to_start"] },
  { id: "working", label: "In progress", color: "cyan", stages: ["working", "quality_check"] },
  { id: "ready", label: "Ready", color: "green", stages: ["ready_pickup"] },
];

function JobCard({ order, stages, onMove }) {
  const services = (order.services || []).map((item) => item.description).filter(Boolean);
  const late = order.promisedAt && new Date(order.promisedAt) < new Date();
  return <article className="flow-job-card">
    <Link className="flow-card-main" to={`/work-orders/${order._id}`}>
      <div className="flow-vehicle-visual"><CarFront /><span>{order.vehicle?.plate || "YEROS"}</span></div>
      <div className="flow-card-code"><span>{order.orderNumber}</span><b className={`flow-stage-tag ${order.workflowStage}`}>{stageLabels[order.workflowStage]}</b></div>
      <h3>{services[0] || "General vehicle service"}</h3>
      {services.length > 1 && <small className="flow-more-services">+{services.length - 1} additional service{services.length > 2 ? "s" : ""}</small>}
      <div className="flow-card-person"><CarFront /><span>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "Vehicle not recorded"}</span></div>
      <div className="flow-card-person"><UserRound /><span>{order.customer?.name || "Customer not recorded"}</span></div>
      {order.promisedAt && <div className={`flow-card-person ${late ? "late" : ""}`}><Clock3 /><span>{late ? "Past due · " : "Promised · "}{new Date(order.promisedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span></div>}
      <footer><span>{order.assignedTechnician?.name || "Unassigned"}</span><strong>{money.format(order.total || 0)}</strong><ChevronRight /></footer>
    </Link>
    <label className="flow-move"><span>Move to</span><select aria-label={`Move ${order.orderNumber}`} value={order.workflowStage} onChange={(event) => onMove(order._id, event.target.value)}>{stages.map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select></label>
  </article>;
}

export default function WorkshopBoard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("columns");
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  async function load() { try { setData((await api.get("/workshop")).data); } catch (requestError) { setError(errorMessage(requestError)); } }
  useEffect(() => { load(); const timer = setInterval(() => { if (!document.hidden) load(); }, 60000); return () => clearInterval(timer); }, []);
  async function move(id, stage) { try { await api.put(`/workshop/${id}/stage`, { stage }); await load(); } catch (requestError) { setError(errorMessage(requestError)); } }

  const orders = useMemo(() => {
    if (!data) return [];
    const all = data.stages.flatMap((stage) => data.columns[stage] || []);
    const term = query.trim().toLowerCase();
    return all.filter((order) => (!stageFilter || order.workflowStage === stageFilter) && (!term || [order.orderNumber, order.customer?.name, order.vehicle?.make, order.vehicle?.model, order.vehicle?.plate, ...(order.services || []).map((item) => item.description)].some((value) => String(value || "").toLowerCase().includes(term))));
  }, [data, query, stageFilter]);

  if (!data) return <div className="page"><Loading /></div>;
  return <div className="page flow-workspace">
    <Alert message={error} onClose={() => setError("")} />
    <header className="flow-header"><div><span>Workshop operations</span><h1>Workflow</h1><p>See every job, find the blocker and move the repair forward.</p></div><Link className="flow-new-button" to="/work-orders?new=1"><Plus />New work order</Link></header>
    <section className="flow-summary"><article><Wrench /><div><span>Active</span><strong>{data.summary.active}</strong></div></article><article className={data.summary.overdue ? "danger" : ""}><AlertTriangle /><div><span>Past due</span><strong>{data.summary.overdue}</strong></div></article><article><PackageSearch /><div><span>Waiting parts</span><strong>{data.summary.waitingParts}</strong></div></article><article><CheckCircle2 /><div><span>Ready</span><strong>{data.summary.ready}</strong></div></article></section>
    <section className="flow-toolbar"><div className="flow-view-tabs"><button className={view === "columns" ? "active" : ""} onClick={() => setView("columns")}><Columns3 />Columns</button><button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List />List</button></div><label className="flow-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search order, customer, vehicle or service" /></label><select aria-label="Filter workflow stage" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="">All stages</option>{data.stages.filter((stage) => stage !== "delivered").map((stage) => <option key={stage} value={stage}>{stageLabels[stage]}</option>)}</select><button className="flow-refresh" onClick={load}>Refresh</button></section>
    {view === "columns" ? <section className="flow-board">{groups.map((group) => {
      const jobs = orders.filter((order) => group.stages.includes(order.workflowStage));
      return <section className={`flow-column ${group.color}`} key={group.id}><header><div><i /><span>{group.label}</span></div><b>{jobs.length}</b></header><div>{jobs.length ? jobs.map((order) => <JobCard key={order._id} order={order} stages={data.stages} onMove={move} />) : <div className="flow-empty"><CheckCircle2 /><span>No jobs here</span></div>}</div></section>;
    })}</section> : <section className="flow-list">{orders.length ? orders.map((order) => <JobCard key={order._id} order={order} stages={data.stages} onMove={move} />) : <div className="flow-empty"><Search /><span>No jobs match your search.</span></div>}</section>}
  </div>;
}
