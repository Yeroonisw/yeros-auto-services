import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CarFront, CheckCircle2, Clock3, FilePlus2, MapPin, Phone, UserRound } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const statusLabels = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export default function AppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState("");
  const [creatingOrder, setCreatingOrder] = useState(false);

  async function loadAppointment() {
    try {
      const { data } = await api.get(`/appointments/${id}`);
      setAppointment(data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  useEffect(() => { loadAppointment(); }, [id]);

  async function createWorkOrder() {
    setCreatingOrder(true);
    setError("");
    try {
      const { data } = await api.post(`/appointments/${id}/work-order`);
      navigate(`/work-orders/${data._id}?edit=1`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setCreatingOrder(false);
    }
  }

  if (!appointment && !error) return <div className="page"><Loading /></div>;

  return <div className="page appointment-detail-page">
    <Alert message={error} onClose={() => setError("")} />
    {appointment && <>
      <div className="detail-topbar">
        <Link className="back-link" to="/appointments"><ArrowLeft size={17} /> Appointments</Link>
        <button className="button primary" onClick={createWorkOrder} disabled={creatingOrder || !appointment.vehicle}>
          <FilePlus2 size={16} /> {creatingOrder ? "Creating..." : "Create work order"}
        </button>
      </div>

      <section className="detail-hero appointment-detail-hero">
        <div>
          <p className="eyebrow">Appointment profile</p>
          <h1>{appointment.title}</h1>
          <p>{appointment.customer?.name} - {new Date(appointment.scheduledAt).toLocaleString()}</p>
        </div>
        <span className={"status large appointment-" + appointment.status}>{statusLabels[appointment.status]}</span>
      </section>

      <section className="detail-summary-grid">
        <article><CalendarDays /><span>Date</span><strong>{new Date(appointment.scheduledAt).toLocaleDateString()}</strong><small>{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></article>
        <article><Clock3 /><span>Duration</span><strong>{appointment.durationMinutes || 60} min</strong><small>{appointment.serviceType || "General service"}</small></article>
        <article><UserRound /><span>Customer</span><strong>{appointment.customer?.name}</strong><small>{appointment.customer?.phone || "No phone"}<br />{appointment.customer?.email || "No email"}</small></article>
        <article><CarFront /><span>Vehicle</span><strong>{appointment.vehicle ? `${appointment.vehicle.year} ${appointment.vehicle.make} ${appointment.vehicle.model}` : "No vehicle"}</strong><small>{appointment.vehicle?.plate || "No plate"}</small></article>
      </section>

      <div className="detail-columns">
        <section className="panel detail-section">
          <div className="panel-heading"><h2>Appointment details</h2><p>Information for the scheduled visit.</p></div>
          <div className="appointment-profile-list">
            <div><MapPin /><span>Location</span><strong>{appointment.location || appointment.customer?.address || "Not set"}</strong></div>
            <div><Phone /><span>Contact</span><strong>{appointment.customer?.phone || "Not set"}</strong></div>
            <div><CheckCircle2 /><span>Priority</span><strong>{appointment.priority || "normal"}</strong></div>
          </div>
        </section>
        <aside className="detail-side">
          <section className="panel detail-section">
            <div className="panel-heading"><h2>Notes</h2></div>
            <p className="detail-notes">{appointment.notes || "No notes recorded for this appointment."}</p>
          </section>
          <section className="panel detail-section">
            <div className="panel-heading"><h2>Work order conversion</h2><p>Create a pending work order from this appointment.</p></div>
            <p className="detail-notes">The work order will use the appointment customer, vehicle, title, service type, location and notes.</p>
            {!appointment.vehicle && <p className="detail-notes warning-note">A vehicle is required before creating a work order.</p>}
          </section>
        </aside>
      </div>
    </>}
  </div>;
}
