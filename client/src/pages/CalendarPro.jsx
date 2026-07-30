import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, MessageCircle, Phone, UserRound, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const statusLabels = { scheduled: "Pending", confirmed: "Confirmed", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled", no_show: "No show" };
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
function dateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function CalendarPro() {
  const [appointments, setAppointments] = useState(null);
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(startOfDay(new Date()));
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/appointments").then(({ data }) => setAppointments(data)).catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  const days = useMemo(() => {
    if (view === "day") return [anchor];
    if (view === "week") {
      const first = new Date(anchor); first.setDate(first.getDate() - first.getDay());
      return Array.from({ length: 7 }, (_, index) => { const date = new Date(first); date.setDate(first.getDate() + index); return date; });
    }
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const gridStart = new Date(first); gridStart.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, index) => { const date = new Date(gridStart); date.setDate(gridStart.getDate() + index); return date; });
  }, [anchor, view]);

  const grouped = useMemo(() => (appointments || []).reduce((result, item) => {
    const key = dateKey(item.scheduledAt);
    (result[key] ||= []).push(item);
    return result;
  }, {}), [appointments]);

  function move(direction) {
    const date = new Date(anchor);
    if (view === "day") date.setDate(date.getDate() + direction);
    else if (view === "week") date.setDate(date.getDate() + direction * 7);
    else date.setMonth(date.getMonth() + direction);
    setAnchor(date);
  }
  function whatsapp(appointment) {
    const phone = appointment.customer?.phone?.replace(/\D/g, "");
    if (!phone) return setError("This customer does not have a valid phone number.");
    const message = `Hello ${appointment.customer.name}, this is Yeros Auto Services regarding your appointment on ${new Date(appointment.scheduledAt).toLocaleString("en-US")}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <div className="page business-module calendar-pro">
    <Alert message={error} onClose={() => setError("")} />
    <header className="module-hero"><div><span className="eyebrow">Professional scheduling</span><h1>Service calendar</h1><p>Travel time, repair duration, mechanic status and customer actions in one schedule.</p></div><Link className="button primary" to="/appointments"><CalendarDays /> Manage appointments</Link></header>
    <section className="calendar-controls">
      <div className="view-tabs">{["day", "week", "month"].map((item) => <button className={view === item ? "active" : ""} onClick={() => setView(item)} key={item}>{item}</button>)}</div>
      <div className="calendar-period"><button onClick={() => move(-1)}><ChevronLeft /></button><strong>{view === "month" ? anchor.toLocaleDateString("en-US", { month: "long", year: "numeric" }) : `${days[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${days.at(-1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}</strong><button onClick={() => move(1)}><ChevronRight /></button><button onClick={() => setAnchor(startOfDay(new Date()))}>Today</button></div>
    </section>
    {!appointments ? <Loading /> : <section className={`calendar-grid ${view}`}>
      {days.map((day) => {
        const items = grouped[dateKey(day)] || [];
        const outside = view === "month" && day.getMonth() !== anchor.getMonth();
        return <article className={`${outside ? "outside" : ""} ${dateKey(day) === dateKey(new Date()) ? "today" : ""}`} key={dateKey(day)}>
          <header><span>{day.toLocaleDateString("en-US", { weekday: view === "month" ? "short" : "long" })}</span><strong>{day.getDate()}</strong></header>
          <div>{items.length ? items.map((appointment) => <Link to={`/appointments/${appointment._id}`} className={`calendar-event ${appointment.status}`} key={appointment._id}>
            <div><time><Clock3 />{new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</time><b>{appointment.durationMinutes}m</b></div>
            <strong>{appointment.title}</strong><span><UserRound />{appointment.customer?.name}</span>
            {view !== "month" && <><span><Wrench />{appointment.mechanic || "Yero"} · {appointment.mechanicStatus || "available"}</span>{appointment.location && <span><MapPin />{appointment.location}</span>}
              <footer onClick={(event) => event.preventDefault()}><a href={`tel:${appointment.customer?.phone}`}><Phone /></a><button onClick={() => whatsapp(appointment)}><MessageCircle /></button>{appointment.location && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.location)}`} target="_blank" rel="noreferrer"><MapPin /></a>}</footer></>}
            <i>{statusLabels[appointment.status]}</i>
          </Link>) : view !== "month" && <Empty title="Open schedule" text="No service is booked for this day." />}</div>
        </article>;
      })}
    </section>}
  </div>;
}
