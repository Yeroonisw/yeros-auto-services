import { useEffect, useState } from "react";
import { CalendarDays, CarFront, CheckCircle2, ClipboardCheck, CreditCard, FileText, LogOut, ShieldCheck, Wrench, XCircle } from "lucide-react";
import api, { errorMessage } from "../api.js";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CustomerPortal() {
  const [token, setToken] = useState(() => sessionStorage.getItem("yeros_portal_token"));
  const [form, setForm] = useState({ phone: "", code: "" });
  const [account, setAccount] = useState(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  async function load(currentToken = token) {
    if (!currentToken) return;
    try { setAccount((await api.get("/portal/account", { headers: { Authorization: `Bearer ${currentToken}` }, skipAdminAuth: true })).data); } catch (requestError) { setError(errorMessage(requestError)); sessionStorage.removeItem("yeros_portal_token"); setToken(null); }
  }
  useEffect(() => { load(); }, [token]);
  async function login(event) { event.preventDefault(); try { const { data } = await api.post("/portal/login", form); sessionStorage.setItem("yeros_portal_token", data.token); setToken(data.token); } catch (requestError) { setError(errorMessage(requestError)); } }
  async function decide(id, decision) { if (!signature.trim()) return setError("Enter your full name before approving or declining."); try { await api.post(`/portal/estimates/${id}/decision`, { decision, signature }, { headers: { Authorization: `Bearer ${token}` }, skipAdminAuth: true }); await load(); } catch (requestError) { setError(errorMessage(requestError)); } }
  if (!token) return <div className="portal-login"><main><img src="/yeros-auto-logo.png" alt="Yeros Auto Services" /><span>Customer portal</span><h1>Your vehicle service, in one place.</h1><p>View appointments, estimates, inspections, repairs and payments.</p>{error && <div className="form-error">{error}</div>}<form onSubmit={login}><label>Phone number<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label><label>6-digit access code<input inputMode="numeric" maxLength="6" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></label><button><ShieldCheck />Secure sign in</button></form><small>Request an access code from Yeros Auto Services.</small></main></div>;
  if (!account) return <div className="portal-login"><main><p>{error || "Loading your account..."}</p></main></div>;
  return <div className="customer-portal"><header><img src="/yeros-auto-logo.png" alt="Yeros Auto Services" /><div><span>Customer portal</span><strong>{account.customer.name}</strong></div><button onClick={() => { sessionStorage.removeItem("yeros_portal_token"); setToken(null); }}><LogOut />Sign out</button></header><main>{error && <div className="form-error">{error}</div>}<section className="portal-welcome"><span>Welcome back</span><h1>Your garage</h1><p>Everything Yeros Auto Services has on file for your vehicles.</p></section>
    <section className="portal-vehicles">{account.vehicles.map((vehicle) => <article key={vehicle._id}><CarFront /><div><h2>{vehicle.year} {vehicle.make} {vehicle.model}</h2><p>{vehicle.plate || "No plate"} · {Number(vehicle.mileage || 0).toLocaleString()} miles</p></div><span>Next oil service<strong>{vehicle.oilChange?.lastMileage ? `${Number(vehicle.oilChange.lastMileage + vehicle.oilChange.intervalMiles).toLocaleString()} mi` : "Not scheduled"}</strong></span></article>)}</section>
    <section className="portal-grid"><article><header><CalendarDays /><h2>Appointments</h2></header>{account.appointments.slice(0, 5).map((item) => <div key={item._id}><strong>{item.title}</strong><span>{new Date(item.scheduledAt).toLocaleString()} · {item.status}</span></div>)}</article><article><header><Wrench /><h2>Repair history</h2></header>{account.orders.slice(0, 5).map((item) => <div key={item._id}><strong>{item.orderNumber}</strong><span>{item.services.map((service) => service.description).join(", ")} · {item.paymentStatus}</span></div>)}</article></section>
    <section className="portal-estimates"><header><FileText /><div><h2>Estimates</h2><p>Review and approve recommendations electronically.</p></div></header>{account.estimates.map((estimate) => <article key={estimate._id}><div><strong>{estimate.estimateNumber}</strong><span>{estimate.vehicle?.year} {estimate.vehicle?.make} {estimate.vehicle?.model}</span></div><b>{money.format(estimate.total)}</b><i>{estimate.status}</i>{["draft","sent"].includes(estimate.status) && <div className="portal-decision"><input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Full name signature" /><button onClick={() => decide(estimate._id, "declined")}><XCircle />Decline</button><button onClick={() => decide(estimate._id, "approved")}><CheckCircle2 />Approve</button></div>}</article>)}</section>
    <section className="portal-grid"><article><header><ClipboardCheck /><h2>Inspections</h2></header>{account.inspections.slice(0, 5).map((item) => <div key={item._id}><strong>{item.inspectionNumber}</strong><span>{new Date(item.createdAt).toLocaleDateString()} · {item.status}</span></div>)}</article><article><header><CreditCard /><h2>Payments</h2></header>{account.payments.slice(0, 5).map((item) => <div key={item._id}><strong>{money.format(item.amount)}</strong><span>{item.method} · {item.status}</span></div>)}</article></section>
  </main></div>;
}
