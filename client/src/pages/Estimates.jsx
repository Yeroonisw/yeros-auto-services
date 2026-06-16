import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const statusLabels = { draft: "Draft", sent: "Sent", approved: "Approved", rejected: "Rejected", converted: "Converted" };
const blank = { customer: "", vehicle: "", status: "draft", services: [{ description: "", quantity: 1, price: 0 }], labor: 0, taxRate: 0, notes: "", validUntil: "" };

export default function Estimates() {
  const navigate = useNavigate();
  const [estimates, setEstimates] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);

  async function load() {
    setLoading(true);
    try {
      const [{ data: estimateData }, { data: customerData }, { data: vehicleData }] = await Promise.all([api.get("/estimates"), api.get("/customers"), api.get("/vehicles")]);
      setEstimates(estimateData); setCustomers(customerData); setVehicles(vehicleData);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const customerVehicles = useMemo(() => vehicles.filter((vehicle) => (vehicle.customer?._id || vehicle.customer) === form.customer), [vehicles, form.customer]);
  const subtotal = useMemo(() => (form.services || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0) + Number(form.labor || 0), [form]);

  function open(estimate = null) {
    setEditing(estimate);
    if (estimate) {
      setForm({
        customer: estimate.customer?._id || "", vehicle: estimate.vehicle?._id || "", status: estimate.status,
        services: estimate.services?.length ? estimate.services.map(({ description, quantity, price }) => ({ description, quantity, price })) : [{ description: "", quantity: 1, price: 0 }],
        labor: estimate.labor || 0, taxRate: estimate.taxRate || 0, notes: estimate.notes || "",
        validUntil: estimate.validUntil ? estimate.validUntil.slice(0, 10) : "",
      });
    } else {
      const customer = customers[0]?._id || "";
      const vehicle = vehicles.find((item) => (item.customer?._id || item.customer) === customer);
      setForm({ ...blank, customer, vehicle: vehicle?._id || "", services: [{ description: "", quantity: 1, price: 0 }] });
    }
    setModalOpen(true);
  }

  function updateCustomer(customer) {
    const vehicle = vehicles.find((item) => (item.customer?._id || item.customer) === customer);
    setForm({ ...form, customer, vehicle: vehicle?._id || "" });
  }

  function updateLine(index, field, value) {
    setForm({ ...form, services: form.services.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = { ...form, validUntil: form.validUntil || null, services: form.services.filter((item) => item.description.trim()) };
      if (editing) await api.put(`/estimates/${editing._id}`, payload);
      else await api.post("/estimates", payload);
      setModalOpen(false); await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function downloadPdf(estimate) {
    try {
      const response = await api.get(`/estimates/${estimate._id}/pdf`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url; link.download = `${estimate.estimateNumber}.pdf`; link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function convert(estimate) {
    if (!window.confirm(`Convert ${estimate.estimateNumber} into a work order?`)) return;
    try {
      await api.post(`/estimates/${estimate._id}/convert`);
      await load();
      navigate("/work-orders");
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function remove(estimate) {
    if (!window.confirm(`Delete ${estimate.estimateNumber}?`)) return;
    try { await api.delete(`/estimates/${estimate._id}`); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">Sales</p><h1>Estimates</h1><p>Prepare prices for approval, export them and convert accepted work.</p></div>
      <button className="button primary" onClick={() => open()} disabled={!customers.length || !vehicles.length}>+ New estimate</button>
    </div>
    <Alert message={error} onClose={() => setError("")} />
    <section className="panel">
      {loading ? <Loading /> : estimates.length ? <div className="table-wrap"><table>
        <thead><tr><th>Estimate</th><th>Customer / Vehicle</th><th>Status</th><th>Valid until</th><th>Total</th><th className="actions">Actions</th></tr></thead>
        <tbody>{estimates.map((estimate) => <tr key={estimate._id}>
          <td><strong>{estimate.estimateNumber}</strong></td>
          <td>{estimate.customer?.name}<small className="table-note">{estimate.vehicle ? `${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model}` : "-"}</small></td>
          <td><span className={`status estimate-${estimate.status}`}>{statusLabels[estimate.status]}</span></td>
          <td>{estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : "-"}</td>
          <td><strong>{money.format(estimate.total || 0)}</strong></td>
          <td className="actions">
            <button className="text-button" onClick={() => downloadPdf(estimate)}>PDF</button>
            {estimate.status !== "converted" && <button className="text-button" onClick={() => convert(estimate)}>Convert</button>}
            {estimate.status !== "converted" && <button className="text-button" onClick={() => open(estimate)}>Edit</button>}
            {estimate.status !== "converted" && <button className="text-button danger" onClick={() => remove(estimate)}>Delete</button>}
          </td>
        </tr>)}</tbody>
      </table></div> : <Empty>No estimates yet. Create one for the next customer approval.</Empty>}
    </section>
    {modalOpen && <Modal title={editing ? `Edit ${editing.estimateNumber}` : "New estimate"} onClose={() => setModalOpen(false)} wide>
      <form className="form-grid" onSubmit={submit}>
        <label>Customer<select value={form.customer} onChange={(e) => updateCustomer(e.target.value)} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
        <label>Vehicle<select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required><option value="">Select vehicle</option>{customerVehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(statusLabels).filter(([value]) => value !== "converted").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Valid until<input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} /></label>
        <div className="span-2 service-editor">
          <div className="service-heading"><strong>Services and parts</strong><button type="button" className="text-button" onClick={() => setForm({ ...form, services: [...form.services, { description: "", quantity: 1, price: 0 }] })}>+ Add line</button></div>
          {form.services.map((item, index) => <div className="service-row" key={index}>
            <input placeholder="Description" value={item.description} onChange={(e) => updateLine(index, "description", e.target.value)} />
            <input type="number" min="0" step="0.1" value={item.quantity} onChange={(e) => updateLine(index, "quantity", Number(e.target.value))} />
            <input type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateLine(index, "price", Number(e.target.value))} />
            <button type="button" className="remove-line" onClick={() => setForm({ ...form, services: form.services.filter((_, i) => i !== index) })} disabled={form.services.length === 1}>x</button>
          </div>)}
        </div>
        <label>Labor<input type="number" min="0" step="0.01" value={form.labor} onChange={(e) => setForm({ ...form, labor: Number(e.target.value) })} /></label>
        <label>Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} /></label>
        <label className="span-2">Notes<textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
        <div className="order-total span-2"><span>Estimate total</span><strong>{money.format(subtotal * (1 + Number(form.taxRate || 0) / 100))}</strong></div>
        <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save estimate"}</button></div>
      </form>
    </Modal>}
  </div>;
}
