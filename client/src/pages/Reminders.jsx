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
  const [automation, setAutomation] = useState(null);
  const [notice, setNotice] = useState("");
  async function load() {
    try {
      const [reminderResponse, automationResponse] = await Promise.all([api.get("/reminders"), api.get("/reminders/automation-status")]);
      setData(reminderResponse.data); setAutomation(automationResponse.data);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { load(); }, []);
  const items = useMemo(() => (data?.items || []).filter((item) => filter === "all" || item.type === filter), [data, filter]);

  async function openWhatsApp(item) {
    if (!item.customer?._id) return setError("This reminder is missing a customer.");
    try {
      const { data: response } = await api.post("/reminders/dispatch", { customer: item.customer._id, channel: "whatsapp", message: item.message });
      if (response.queued) setNotice("WhatsApp automation queued successfully.");
      else if (response.whatsappUrl) window.open(response.whatsappUrl, "_blank", "noopener,noreferrer");
      else setError(response.message);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  return <div className="page business-module reminders-page">
    <Alert message={error} onClose={() => setError("")} />
    {notice && <div className="success-banner"><Check />{notice}</div>}
    <header className="module-hero"><div><span className="eyebrow">Automatic follow-up</span><h1>Customer reminders</h1><p>Oil changes, appointments, estimates, invoices and post-repair care in one queue.</p></div><span className="hero-count"><BellRing />{data?.items?.length || 0}</span></header>
    {data ? <>
      <section className={`automation-banner ${automation?.webhookConfigured ? "connected" : ""}`}><span><BellRing /></span><div><strong>{automation?.webhookConfigured ? "Automatic messaging connected" : "Smart queue active"}</strong><p>{automation?.webhookConfigured ? "Messages can be dispatched automatically through the configured provider." : "WhatsApp opens with each message prepared. Connect an automation webhook for unattended delivery."}</p></div><b>{automation?.webhookConfigured ? "Connected" : "Manual send"}</b></section>
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
