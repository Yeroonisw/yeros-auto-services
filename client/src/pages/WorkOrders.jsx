import { useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";
import { useNavigate } from "react-router-dom";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const labels = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
const paymentMethods = ["Pending", "Cash", "Credit / Debit Card", "Zelle", "Cash App", "Check", "Other"];
const blank = {
  customer: "", vehicle: "", status: "pending",
  services: [{ description: "", quantity: 1, price: 0, cost: 0 }],
  dtcCodes: [{ code: "", description: "", status: "active" }],
  labor: 0, taxRate: 0, paymentMethod: "Pending", notes: "",
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [{ data: orderData }, { data: customerData }, { data: vehicleData }] = await Promise.all([api.get("/work-orders"), api.get("/customers"), api.get("/vehicles")]);
      setOrders(orderData); setCustomers(customerData); setVehicles(vehicleData);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const customerVehicles = useMemo(() => vehicles.filter((vehicle) => (vehicle.customer?._id || vehicle.customer) === form.customer), [vehicles, form.customer]);
  const subtotal = useMemo(() => form.services.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0) + Number(form.labor || 0), [form]);
  const partsCost = useMemo(() => form.services.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.cost || 0), 0), [form]);

  function open(order = null) {
    setEditing(order);
    if (order) {
      setForm({
        customer: order.customer?._id || "", vehicle: order.vehicle?._id || "", status: order.status,
        services: order.services.length ? order.services.map(({ description, quantity, price, cost }) => ({ description, quantity, price, cost: cost || 0 })) : [{ description: "", quantity: 1, price: 0, cost: 0 }],
        dtcCodes: order.dtcCodes?.length ? order.dtcCodes.map(({ code, description, status }) => ({ code, description, status })) : [{ code: "", description: "", status: "active" }],
        labor: order.labor || 0, taxRate: order.taxRate || 0, paymentMethod: order.paymentMethod || "Pending", notes: order.notes || "",
      });
    } else {
      const customer = customers[0]?._id || "";
      const firstVehicle = vehicles.find((vehicle) => (vehicle.customer?._id || vehicle.customer) === customer);
      setForm({ ...blank, customer, vehicle: firstVehicle?._id || "", services: [{ description: "", quantity: 1, price: 0, cost: 0 }], dtcCodes: [{ code: "", description: "", status: "active" }] });
    }
    setModalOpen(true);
  }

  function updateCustomer(customer) {
    const firstVehicle = vehicles.find((vehicle) => (vehicle.customer?._id || vehicle.customer) === customer);
    setForm({ ...form, customer, vehicle: firstVehicle?._id || "" });
  }

  function updateService(index, field, value) {
    setForm({ ...form, services: form.services.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) });
  }

  function updateDtc(index, field, value) {
    setForm({ ...form, dtcCodes: form.dtcCodes.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) });
  }

  async function downloadInvoice(order) {
    try {
      const response = await api.get(`/work-orders/${order._id}/invoice`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${order.orderNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        services: form.services.filter((item) => item.description.trim()),
        dtcCodes: form.dtcCodes.filter((item) => item.code.trim()),
      };
      if (editing) await api.put(`/work-orders/${editing._id}`, payload);
      else await api.post("/work-orders", payload);
      setModalOpen(false); await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function remove(order) {
    if (!window.confirm(`Delete work order ${order.orderNumber}?`)) return;
    try { await api.delete(`/work-orders/${order._id}`); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div><p className="eyebrow">Service desk</p><h1>Work orders</h1><p>Create estimates, track repairs and close completed jobs.</p></div>
        <button className="button primary" onClick={() => open()} disabled={!customers.length || !vehicles.length}>+ New work order</button>
      </div>
      {(!customers.length || !vehicles.length) && !loading && <Alert message="Add at least one customer and vehicle before creating a work order." onClose={() => {}} />}
      <Alert message={error} onClose={() => setError("")} />
      <section className="panel">
        {loading ? <Loading /> : orders.length ? <div className="table-wrap"><table>
          <thead><tr><th>Order</th><th>Customer / Vehicle</th><th>Status</th><th>Opened</th><th>Total</th><th className="actions">Actions</th></tr></thead>
          <tbody>{orders.map((order) => <tr key={order._id}>
            <td><button className="record-link" onClick={() => navigate(`/work-orders/${order._id}`)}>{order.orderNumber}</button></td>
            <td>{order.customer?.name || "-"}<small className="table-note">{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "-"}</small></td>
            <td><span className={`status ${order.status}`}>{labels[order.status]}</span></td>
            <td>{new Date(order.openedAt).toLocaleDateString()}</td><td><strong>{money.format(order.total || 0)}</strong></td>
            <td className="actions"><button className="text-button view-button" onClick={() => navigate(`/work-orders/${order._id}`)}>View</button><button className="text-button" onClick={() => downloadInvoice(order)}>PDF</button><button className="text-button" onClick={() => open(order)}>Edit</button><button className="text-button danger" onClick={() => remove(order)}>Delete</button></td>
          </tr>)}</tbody>
        </table></div> : <Empty>No work orders yet. Create one when a vehicle is ready for service.</Empty>}
      </section>
      {modalOpen && <Modal title={editing ? `Edit ${editing.orderNumber}` : "New work order"} onClose={() => setModalOpen(false)} wide>
        <form className="form-grid" onSubmit={submit}>
          <label>Customer<select value={form.customer} onChange={(e) => updateCustomer(e.target.value)} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
          <label>Vehicle<select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} required><option value="">Select vehicle</option>{customerVehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.plate ? `- ${vehicle.plate}` : ""}</option>)}</select></label>
          <label className="span-2">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="span-2 service-editor">
            <div className="service-heading"><strong>Services and parts</strong><button type="button" className="text-button" onClick={() => setForm({ ...form, services: [...form.services, { description: "", quantity: 1, price: 0, cost: 0 }] })}>+ Add line</button></div>
            <div className="service-row service-labels"><span>Description</span><span>Qty</span><span>Sale price</span><span>Part cost</span><span /></div>
            {form.services.map((item, index) => <div className="service-row" key={index}>
              <input aria-label="Description" placeholder="Description" value={item.description} onChange={(e) => updateService(index, "description", e.target.value)} />
              <input aria-label="Quantity" type="number" min="0" step="0.1" value={item.quantity} onChange={(e) => updateService(index, "quantity", Number(e.target.value))} />
              <input aria-label="Price" type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateService(index, "price", Number(e.target.value))} />
              <input aria-label="Internal part cost" type="number" min="0" step="0.01" value={item.cost || 0} onChange={(e) => updateService(index, "cost", Number(e.target.value))} />
              <button type="button" className="remove-line" onClick={() => setForm({ ...form, services: form.services.filter((_, i) => i !== index) })} disabled={form.services.length === 1}>x</button>
            </div>)}
          </div>
          <div className="span-2 service-editor">
            <div className="service-heading"><strong>Diagnostic trouble codes (DTC)</strong><button type="button" className="text-button" onClick={() => setForm({ ...form, dtcCodes: [...form.dtcCodes, { code: "", description: "", status: "active" }] })}>+ Add DTC</button></div>
            {form.dtcCodes.map((item, index) => <div className="dtc-row" key={index}>
              <input aria-label="DTC code" placeholder="P0300" value={item.code} onChange={(e) => updateDtc(index, "code", e.target.value.toUpperCase())} />
              <input aria-label="DTC description" placeholder="Description or diagnostic note" value={item.description} onChange={(e) => updateDtc(index, "description", e.target.value)} />
              <select aria-label="DTC status" value={item.status} onChange={(e) => updateDtc(index, "status", e.target.value)}><option value="active">Active</option><option value="pending">Pending</option><option value="history">History</option></select>
              <button type="button" className="remove-line" onClick={() => setForm({ ...form, dtcCodes: form.dtcCodes.filter((_, i) => i !== index) })} disabled={form.dtcCodes.length === 1}>x</button>
            </div>)}
          </div>
          <label>Labor<input type="number" min="0" step="0.01" value={form.labor} onChange={(e) => setForm({ ...form, labor: Number(e.target.value) })} /></label>
          <label>Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} /></label>
          <label className="span-2">Payment method<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <label className="span-2">Notes<textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="order-total span-2"><span>Estimated total</span><strong>{money.format(subtotal * (1 + Number(form.taxRate || 0) / 100))}</strong></div>
          <div className="profit-preview span-2"><span>Parts cost: <strong>{money.format(partsCost)}</strong></span><span>Gross profit before overhead: <strong>{money.format(subtotal - partsCost)}</strong></span></div>
          <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save work order"}</button></div>
        </form>
      </Modal>}
    </div>
  );
}
