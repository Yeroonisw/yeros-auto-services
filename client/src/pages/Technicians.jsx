import { useEffect, useState } from "react";
import { Clock3, Gauge, Play, Square, UserCog, Wrench } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function Technicians() {
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [selection, setSelection] = useState({ technician: "", workOrder: "" });
  const [error, setError] = useState("");
  async function load() {
    try { const [team, work] = await Promise.all([api.get("/technicians"), api.get("/work-orders")]); setData(team.data); setOrders(work.data.filter((item) => item.status !== "completed")); } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { load(); }, []);
  async function assign() { try { await api.post("/technicians/assign", selection); await load(); } catch (requestError) { setError(errorMessage(requestError)); } }
  async function clockIn() { try { await api.post("/technicians/clock-in", selection); await load(); } catch (requestError) { setError(errorMessage(requestError)); } }
  async function clockOut(id) { try { await api.post(`/technicians/clock-out/${id}`); await load(); } catch (requestError) { setError(errorMessage(requestError)); } }
  async function updateCompensation(user, field, value) {
    try {
      await api.put(`/technicians/users/${user._id}/compensation`, {
        hourlyRate: field === "hourlyRate" ? Number(value) : user.hourlyRate,
        commissionRate: field === "commissionRate" ? Number(value) : user.commissionRate,
      });
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  return <div className="page business-module team-page"><Alert message={error} onClose={() => setError("")} /><header className="module-hero"><div><span className="eyebrow">Team productivity</span><h1>Mechanics & time</h1><p>Assign work, track labor time, cost and completed-job profitability.</p></div><span className="hero-count"><UserCog />{data?.users?.length || 0} active</span></header>
    {!data ? <Loading /> : <><section className="team-performance">{data.performance.map((item) => <article key={item.user._id}><div className="team-avatar">{item.user.name?.[0]}</div><div><h2>{item.user.name}</h2><span>{item.user.role}</span></div><dl><div><dt>Open jobs</dt><dd>{item.assigned}</dd></div><div><dt>Completed</dt><dd>{item.completed}</dd></div><div><dt>Hours</dt><dd>{(item.minutes / 60).toFixed(1)}</dd></div><div><dt>Labor cost</dt><dd>{money.format(item.laborCost)}</dd></div><div><dt>Gross profit</dt><dd>{money.format(item.profit)}</dd></div></dl><div className="compensation-inputs"><label>Hourly $<input type="number" min="0" defaultValue={item.user.hourlyRate || 0} onBlur={(e) => updateCompensation(item.user, "hourlyRate", e.target.value)} /></label><label>Commission %<input type="number" min="0" max="100" defaultValue={item.user.commissionRate || 0} onBlur={(e) => updateCompensation(item.user, "commissionRate", e.target.value)} /></label></div></article>)}</section>
      <section className="team-tools"><article className="solid-panel"><header><Wrench /><div><h2>Assign work order</h2><p>Choose a mechanic and an active job.</p></div></header><div className="team-form"><select value={selection.technician} onChange={(e) => setSelection({ ...selection, technician: e.target.value })}><option value="">Mechanic</option>{data.users.map((user) => <option value={user._id} key={user._id}>{user.name}</option>)}</select><select value={selection.workOrder} onChange={(e) => setSelection({ ...selection, workOrder: e.target.value })}><option value="">Work order</option>{orders.map((order) => <option value={order._id} key={order._id}>{order.orderNumber} · {order.customer?.name}</option>)}</select><button className="button primary" onClick={assign} disabled={!selection.technician || !selection.workOrder}>Assign</button><button className="button secondary" onClick={clockIn} disabled={!selection.technician || !selection.workOrder}><Play />Start timer</button></div></article>
      <article className="solid-panel"><header><Clock3 /><div><h2>Recent time entries</h2><p>Live and completed labor timers.</p></div></header><div className="time-list">{data.entries.length ? data.entries.map((entry) => <div key={entry._id}><span className={entry.clockOut ? "complete" : "live"}><Clock3 /></span><div><strong>{entry.technician?.name}</strong><small>{entry.workOrder?.orderNumber} · {new Date(entry.clockIn).toLocaleString()}</small></div><b>{entry.clockOut ? `${entry.minutes} min` : "Running"}</b>{!entry.clockOut && <button onClick={() => clockOut(entry._id)}><Square />Stop</button>}</div>) : <Empty>No time entries yet.</Empty>}</div></article></section></>}
  </div>;
}
