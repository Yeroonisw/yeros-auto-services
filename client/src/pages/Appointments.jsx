import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Clock3, MapPin, Phone, Plus } from "lucide-react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const statusLabels = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};
const serviceTypes = ["General service", "Diagnostic", "Brakes", "Suspension", "Electrical", "Oil change", "AC service", "Roadside help"];
const blank = {
  customer: "",
  vehicle: "",
  title: "",
  serviceType: "General service",
  status: "scheduled",
  scheduledAt: "",
  durationMinutes: 60,
  location: "",
  priority: "normal",
  notes: "",
};

function dateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("upcoming");

  async function load() {
    setLoading(true);
    try {
      const params = filter === "upcoming" ? { from: new Date().toISOString() } : filter === "all" ? {} : { status: filter };
      const [{ data: appointmentData }, { data: customerData }, { data: vehicleData }] = await Promise.all([
        api.get("/appointments", { params }),
        api.get("/customers"),
        api.get("/vehicles"),
      ]);
      setAppointments(appointmentData);
      setCustomers(customerData);
      setVehicles(vehicleData);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filter]);

  const customerVehicles = useMemo(() => vehicles.filter((vehicle) => (vehicle.customer?._id || vehicle.customer) === form.customer), [vehicles, form.customer]);

  function open(appointment = null) {
    setEditing(appointment);
    if (appointment) {
      setForm({
        customer: appointment.customer?._id || "",
        vehicle: appointment.vehicle?._id || "",
        title: appointment.title || "",
        serviceType: appointment.serviceType || "General service",
        status: appointment.status || "scheduled",
        scheduledAt: dateTimeInputValue(appointment.scheduledAt),
        durationMinutes: appointment.durationMinutes || 60,
        location: appointment.location || "",
        priority: appointment.priority || "normal",
        notes: appointment.notes || "",
      });
    } else {
      const customer = customers[0]?._id || "";
      const firstVehicle = vehicles.find((vehicle) => (vehicle.customer?._id || vehicle.customer) === customer);
      setForm({ ...blank, customer, vehicle: firstVehicle?._id || "", scheduledAt: dateTimeInputValue(new Date()) });
    }
    setModalOpen(true);
  }

  function updateCustomer(customer) {
    const firstVehicle = vehicles.find((vehicle) => (vehicle.customer?._id || vehicle.customer) === customer);
    setForm({ ...form, customer, vehicle: firstVehicle?._id || "" });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, vehicle: form.vehicle || null, scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null };
      if (editing) await api.put(`/appointments/${editing._id}`, payload);
      else await api.post("/appointments", payload);
      setModalOpen(false);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function remove(appointment) {
    if (!window.confirm(`Delete appointment for ${appointment.customer?.name || "customer"}?`)) return;
    try {
      await api.delete(`/appointments/${appointment._id}`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return <div className="page appointments-page">
    <div className="page-heading">
      <div><p className="eyebrow">Schedule</p><h1>Appointments</h1><p>Book mobile service visits, track confirmations and keep the daily schedule organized.</p></div>
      <button className="button primary" onClick={() => open()} disabled={!customers.length}><Plus size={16} /> New appointment</button>
    </div>
    {!customers.length && !loading && <Alert message="Add a customer before creating an appointment." onClose={() => {}} />}
    <Alert message={error} onClose={() => setError("")} />

    <section className="appointment-toolbar">
      <div>
        <CalendarPlus size={18} />
        <strong>{appointments.length}</strong>
        <span>{filter === "upcoming" ? "upcoming appointments" : "appointments shown"}</span>
      </div>
      <select value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="upcoming">Upcoming</option>
        <option value="all">All</option>
        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </section>

    <section className="panel appointment-panel">
      {loading ? <Loading /> : appointments.length ? <div className="appointment-list">
        {appointments.map((appointment) => <article className={"appointment-card " + appointment.status} key={appointment._id}>
          <div className="appointment-date">
            <strong>{new Date(appointment.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong>
            <span>{new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          <div className="appointment-main">
            <div className="appointment-title-row"><h3>{appointment.title}</h3><span className={"status appointment-" + appointment.status}>{statusLabels[appointment.status]}</span></div>
            <p>{appointment.customer?.name || "Customer not set"}{appointment.vehicle ? ` · ${appointment.vehicle.year} ${appointment.vehicle.make} ${appointment.vehicle.model}` : ""}</p>
            <div className="appointment-meta">
              <span><Clock3 size={14} /> {appointment.durationMinutes || 60} min</span>
              {appointment.location && <span><MapPin size={14} /> {appointment.location}</span>}
              {appointment.customer?.phone && <a href={"tel:" + appointment.customer.phone}><Phone size={14} /> {appointment.customer.phone}</a>}
            </div>
            {appointment.notes && <small>{appointment.notes}</small>}
          </div>
          <div className="appointment-actions">
            <button className="text-button" onClick={() => open(appointment)}>Edit</button>
            <button className="text-button danger" onClick={() => remove(appointment)}>Delete</button>
          </div>
        </article>)}
      </div> : <Empty>No appointments found for this view.</Empty>}
    </section>

    {modalOpen && <Modal title={editing ? "Edit appointment" : "New appointment"} onClose={() => setModalOpen(false)} wide>
      <form className="form-grid" onSubmit={submit}>
        <label>Customer<select value={form.customer} onChange={(event) => updateCustomer(event.target.value)} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
        <label>Vehicle<select value={form.vehicle} onChange={(event) => setForm({ ...form, vehicle: event.target.value })}><option value="">No vehicle selected</option>{customerVehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.plate ? `- ${vehicle.plate}` : ""}</option>)}</select></label>
        <label className="span-2">Appointment title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Brake inspection, diagnostic visit..." required /></label>
        <label>Service type<select value={form.serviceType} onChange={(event) => setForm({ ...form, serviceType: event.target.value })}>{serviceTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Scheduled date/time<input type="datetime-local" value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} required /></label>
        <label>Duration minutes<input type="number" min="15" step="15" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} /></label>
        <label>Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="normal">Normal</option><option value="urgent">Urgent</option></select></label>
        <label>Location<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Customer address or meeting point" /></label>
        <label className="span-2">Notes<textarea rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
        <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save appointment"}</button></div>
      </form>
    </Modal>}
  </div>;
}
