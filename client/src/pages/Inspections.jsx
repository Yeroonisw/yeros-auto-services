import { useEffect, useMemo, useState } from "react";
import { Camera, CheckCircle2, ClipboardCheck, Plus, Search, Send, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

export default function Inspections() {
  const [items, setItems] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", vehicle: "", mileage: 0 });
  const [error, setError] = useState("");
  async function load() {
    try {
      const [inspectionResponse, customerResponse, vehicleResponse] = await Promise.all([api.get("/inspections"), api.get("/customers"), api.get("/vehicles")]);
      setItems(inspectionResponse.data); setCustomers(customerResponse.data); setVehicles(vehicleResponse.data);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { load(); }, []);
  const availableVehicles = useMemo(() => vehicles.filter((vehicle) => String(vehicle.customer?._id || vehicle.customer) === form.customer), [vehicles, form.customer]);
  async function create(event) {
    event.preventDefault();
    try {
      await api.post("/inspections", form); setOpen(false); await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  return <div className="page business-module">
    <Alert message={error} onClose={() => setError("")} />
    <header className="module-hero"><div><span className="eyebrow">Digital vehicle health</span><h1>Inspections</h1><p>Document every condition with photos, recommendations and customer approval.</p></div><button className="button primary" onClick={() => setOpen(true)}><Plus />New inspection</button></header>
    {!items ? <Loading /> : <>
      <section className="inspection-kpis"><article><ClipboardCheck /><strong>{items.length}</strong><span>Total inspections</span></article><article><TriangleAlert /><strong>{items.filter((item) => item.items.some((entry) => entry.condition === "urgent")).length}</strong><span>With urgent findings</span></article><article><Send /><strong>{items.filter((item) => item.status === "sent").length}</strong><span>Waiting on customer</span></article><article><CheckCircle2 /><strong>{items.filter((item) => item.status === "approved").length}</strong><span>Approved</span></article></section>
      <section className="inspection-list">{items.length ? items.map((inspection) => {
        const urgent = inspection.items.filter((item) => item.condition === "urgent").length;
        const attention = inspection.items.filter((item) => item.condition === "attention").length;
        return <Link to={`/inspections/${inspection._id}`} key={inspection._id}><span className="inspection-mark"><Camera /></span><div><small>{inspection.inspectionNumber}</small><strong>{inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}</strong><span>{inspection.customer?.name} · {new Date(inspection.createdAt).toLocaleDateString()}</span></div><div className="finding-counts"><b className="urgent">{urgent} urgent</b><b className="attention">{attention} attention</b></div><i className={`status ${inspection.status}`}>{inspection.status}</i></Link>;
      }) : <Empty title="No inspections yet" text="Create the first digital vehicle inspection." />}</section>
    </>}
    {open && <Modal title="New digital inspection" onClose={() => setOpen(false)}><form className="form-grid" onSubmit={create}><label>Customer<select value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value, vehicle: "" })} required><option value="">Select customer</option>{customers.map((customer) => <option value={customer._id} key={customer._id}>{customer.name}</option>)}</select></label><label>Vehicle<select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required><option value="">Select vehicle</option>{availableVehicles.map((vehicle) => <option value={vehicle._id} key={vehicle._id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}</select></label><label>Mileage<input type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} /></label><div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button primary">Start inspection</button></div></form></Modal>}
  </div>;
}
