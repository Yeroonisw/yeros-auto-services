import { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarClock, Check, ClipboardCheck, FileWarning, MessageCircle, Receipt, Wrench } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const typeInfo = {
  oil_change: ["Oil change", Wrench],
  brakes: ["Brake service", Wrench],
  appointment: ["Appointment", CalendarClock],
  estimate: ["Estimate", ClipboardCheck],
  invoice: ["Invoice", Receipt],
  repair_follow_up: ["Repair follow-up", Check],
  custom: ["Reminder", BellRing],
};

export default function Reminders() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  async function load() {
    try { setData((await api.get("/reminders")).data); } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { load(); }, []);
  const items = useMemo(() => (data?.items || []).filter((item) => filter === "all" || item.type === filter), [data, filter]);

  function openWhatsApp(item) {
    if (!item.whatsappUrl) return setError("This customer does not have a valid phone number.");
    window.open(item.whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return <div className="page business-module reminders-page">
    <Alert message={error} onClose={() => setError("")} />
    <header className="module-hero"><div><span className="eyebrow">Automatic follow-up</span><h1>Customer reminders</h1><p>Oil changes, appointments, estimates, invoices and post-repair care in one queue.</p></div><span className="hero-count"><BellRing />{data?.items?.length || 0}</span></header>
    {data ? <>
      <section className="reminder-filters">
        {[["all", "All", data.items.length], ["oil_change", "Oil", data.counts.oil], ["appointment", "Appointments", data.counts.appointments], ["estimate", "Estimates", data.counts.estimates], ["invoice", "Invoices", data.counts.invoices], ["repair_follow_up", "Follow-ups", data.counts.followUps]].map(([value, label, count]) =>
          <button className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{label}<b>{count || 0}</b></button>)}
      </section>
      <section className="reminder-queue">{items.length ? items.map((item) => {
        const [label, Icon] = typeInfo[item.type] || ["Reminder", FileWarning];
        return <article key={item.id || item._id}>
          <span className={`reminder-type ${item.type}`}><Icon /></span>
          <div className="reminder-copy"><small>{label} · {new Date(item.dueAt).toLocaleDateString()}</small><h2>{item.title}</h2><strong>{item.customer?.name}</strong>{item.vehicle && <span>{item.vehicle.year} {item.vehicle.make} {item.vehicle.model}</span>}<p>{item.message}</p></div>
          <button className="whatsapp-action" onClick={() => openWhatsApp(item)}><MessageCircle /> WhatsApp</button>
        </article>;
      }) : <Empty title="No reminders in this category" text="The automatic queue is up to date." />}</section>
    </> : <Loading />}
  </div>;
}
