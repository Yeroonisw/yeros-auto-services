import { useEffect, useState } from "react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";
import { useNavigate } from "react-router-dom";

const emptyVehicle = {
  customer: "",
  year: new Date().getFullYear(),
  make: "",
  model: "",
  vin: "",
  plate: "",
  color: "",
  mileage: 0,
  oilChange: { lastDate: "", lastMileage: 0, intervalMiles: 3000, intervalMonths: 3, notes: "" },
};
const oilLabels = { current: "Current", due_soon: "Due soon", overdue: "Overdue" };

function formatOilChange(vehicle) {
  const status = vehicle.oilChangeStatus;
  if (!status?.nextMileage) return "Not set";
  const remaining = Number(status.milesRemaining || 0);
  if (status.status === "overdue") return `${Math.abs(remaining).toLocaleString()} mi overdue`;
  return `${remaining.toLocaleString()} mi left`;
}

export default function Vehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyVehicle);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [{ data: vehicleData }, { data: customerData }] = await Promise.all([api.get("/vehicles"), api.get("/customers")]);
      setVehicles(vehicleData);
      setCustomers(customerData);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function open(vehicle = null) {
    setEditing(vehicle);
    setForm(vehicle ? {
      customer: vehicle.customer?._id || vehicle.customer, year: vehicle.year, make: vehicle.make, model: vehicle.model,
      vin: vehicle.vin || "", plate: vehicle.plate || "", color: vehicle.color || "", mileage: vehicle.mileage || 0,
      oilChange: {
        lastDate: vehicle.oilChange?.lastDate ? vehicle.oilChange.lastDate.slice(0, 10) : "",
        lastMileage: vehicle.oilChange?.lastMileage || 0,
        intervalMiles: vehicle.oilChange?.intervalMiles || 3000,
        intervalMonths: vehicle.oilChange?.intervalMonths || 3,
        notes: vehicle.oilChange?.notes || "",
      },
    } : { ...emptyVehicle, customer: customers[0]?._id || "" });
    setModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, oilChange: { ...form.oilChange, lastDate: form.oilChange.lastDate || null } };
      if (editing) await api.put(`/vehicles/${editing._id}`, payload);
      else await api.post("/vehicles", payload);
      setModalOpen(false);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function remove(vehicle) {
    if (!window.confirm(`Delete ${vehicle.year} ${vehicle.make} ${vehicle.model}?`)) return;
    try {
      await api.delete(`/vehicles/${vehicle._id}`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div><p className="eyebrow">Garage</p><h1>Vehicles</h1><p>Track vehicles, ownership and mileage.</p></div>
        <button className="button primary" onClick={() => open()} disabled={!customers.length}>+ New vehicle</button>
      </div>
      {!customers.length && !loading && <Alert message="Add a customer before creating a vehicle." onClose={() => {}} />}
      <Alert message={error} onClose={() => setError("")} />
      <section className="panel">
        {loading ? <Loading /> : vehicles.length ? (
          <div className="table-wrap"><table>
            <thead><tr><th>Vehicle</th><th>Customer</th><th>Plate / VIN</th><th>Mileage</th><th>Oil change</th><th className="actions">Actions</th></tr></thead>
            <tbody>{vehicles.map((vehicle) => <tr key={vehicle._id}>
              <td><button className="record-link" onClick={() => navigate(`/vehicles/${vehicle._id}`)}>{vehicle.year} {vehicle.make} {vehicle.model}</button><small className="table-note">{vehicle.color || "Color not set"}</small></td>
              <td>{vehicle.customer?.name || "-"}</td><td>{vehicle.plate || "-"}<small className="table-note">{vehicle.vin || "VIN not set"}</small></td>
              <td>{Number(vehicle.mileage || 0).toLocaleString()} mi</td>
              <td><span className={`status oil-${vehicle.oilChangeStatus?.status || "current"}`}>{oilLabels[vehicle.oilChangeStatus?.status] || "Not set"}</span><small className="table-note">{formatOilChange(vehicle)}</small></td>
              <td className="actions"><button className="text-button view-button" onClick={() => navigate(`/vehicles/${vehicle._id}`)}>View</button><button className="text-button" onClick={() => open(vehicle)}>Edit</button><button className="text-button danger" onClick={() => remove(vehicle)}>Delete</button></td>
            </tr>)}</tbody>
          </table></div>
        ) : <Empty>No vehicles yet. Add a customer, then register a vehicle.</Empty>}
      </section>
      {modalOpen && <Modal title={editing ? "Edit vehicle" : "New vehicle"} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={submit}>
          <label className="span-2">Customer<select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
          <label>Year<input type="number" min="1900" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} required /></label>
          <label>Make<input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required /></label>
          <label>Model<input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></label>
          <label>Color<input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></label>
          <label>License plate<input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></label>
          <label>Mileage<input type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} /></label>
          <label className="span-2">VIN<input maxLength="17" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></label>
          <div className="span-2 service-editor">
            <div className="service-heading"><strong>Oil change tracking</strong><span>Reminder by mileage/date</span></div>
            <div className="oil-change-grid">
              <label>Last oil change date<input type="date" value={form.oilChange.lastDate} onChange={(e) => setForm({ ...form, oilChange: { ...form.oilChange, lastDate: e.target.value } })} /></label>
              <label>Last oil change mileage<input type="number" min="0" value={form.oilChange.lastMileage} onChange={(e) => setForm({ ...form, oilChange: { ...form.oilChange, lastMileage: Number(e.target.value) } })} /></label>
              <label>Interval miles<input type="number" min="0" value={form.oilChange.intervalMiles} onChange={(e) => setForm({ ...form, oilChange: { ...form.oilChange, intervalMiles: Number(e.target.value) } })} /></label>
              <label>Interval months<input type="number" min="0" value={form.oilChange.intervalMonths} onChange={(e) => setForm({ ...form, oilChange: { ...form.oilChange, intervalMonths: Number(e.target.value) } })} /></label>
              <label className="span-2">Oil change notes<input value={form.oilChange.notes} onChange={(e) => setForm({ ...form, oilChange: { ...form.oilChange, notes: e.target.value } })} placeholder="Oil type, filter, brand..." /></label>
            </div>
          </div>
          <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save vehicle"}</button></div>
        </form>
      </Modal>}
    </div>
  );
}
