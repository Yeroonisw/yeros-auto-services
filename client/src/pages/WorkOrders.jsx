import { useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const labels = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
const paymentMethods = ["Pending", "Cash", "Credit / Debit Card", "Zelle", "Cash App", "Check", "Other"];
const blank = {
  customer: "", vehicle: "", status: "pending",
  services: [{ description: "", quantity: 1, price: 0, cost: 0 }],
  labor: 0, taxRate: 0, paymentMethod: "Pending", notes: "",
};

export default function WorkOrders() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const { data } = await api.get("/work-orders", { params: { page, limit: 25, status: status || undefined, search: query || undefined } });
      setOrders(data.items); setPagination(data.pagination);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setLoading(false); }
  }
  async function loadReferences() {
    try {
      const [{ data: customerData }, { data: vehicleData }] = await Promise.all([api.get("/customers"), api.get("/vehicles")]);
      setCustomers(customerData); setVehicles(vehicleData);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { loadReferences(); }, []);
  useEffect(() => { loadOrders(); }, [page, status, query]);
  useEffect(() => {
    if (searchParams.get("new") === "1" && customers.length && vehicles.length && !modalOpen) open();
  }, [searchParams, customers, vehicles]);

  const customerVehicles = useMemo(() => vehicles.filter((vehicle) => (vehicle.customer?._id || vehicle.customer) === form.customer), [vehicles, form.customer]);
  const subtotal = useMemo(() => form.services.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0) + Number(form.labor || 0), [form]);

  function open(order = null) {
    setEditing(order);
    if (order) {
      setForm({
        customer: order.customer?._id || "", vehicle: order.vehicle?._id || "", status: order.status,
        services: order.services.length ? order.services.map(({ description, quantity, price, cost }) => ({ description, quantity, price, cost: cost || 0 })) : [{ description: "", quantity: 1, price: 0, cost: 0 }],
        labor: order.labor || 0, taxRate: order.taxRate || 0, paymentMethod: order.paymentMethod || "Pending", notes: order.notes || "",
      });
    } else {
      const customer = customers[0]?._id || "";
      const firstVehicle = vehicles.find((vehicle) => (vehicle.customer?._id || vehicle.customer) === customer);
      setForm({
        ...blank,
        customer,
        vehicle: firstVehicle?._id || "",
        services: [{ description: "", quantity: 1, price: 0, cost: 0 }],
      });
    }
    setModalOpen(true);
  }

  function updateCustomer(customer) {
    const firstVehicle = vehicles.find((vehicle) => (vehicle.customer?._id || vehicle.customer) === customer);
    setForm({ ...form, customer, vehicle: firstVehicle?._id || "" });
  }

  function updateVehicle(vehicleId) {
    setForm({ ...form, vehicle: vehicleId });
  }

  function updateService(index, field, value) {
    setForm({ ...form, services: form.services.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) });
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
      };
      if (editing) await api.put(`/work-orders/${editing._id}`, payload);
      else await api.post("/work-orders", payload);
      setModalOpen(false); setSearchParams({}); await Promise.all([loadOrders(), loadReferences()]);
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function remove(order) {
    if (!window.confirm(`Delete work order ${order.orderNumber}?`)) return;
    try { await api.delete(`/work-orders/${order._id}`); await loadOrders(); }
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
      <form className="module-toolbar order-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
        <label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, service or notes" /></label>
        <select aria-label="Filter by status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }}><option value="">All statuses</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
        <button className="button secondary">Search</button>
      </form>
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
        </table></div> : <Empty>No work orders match this view.</Empty>}
        {!loading && <div className="pagination"><span>{pagination.total} work orders · Page {pagination.page} of {pagination.pages}</span><div><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} aria-label="Previous page"><ChevronLeft /></button><button onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} disabled={page >= pagination.pages} aria-label="Next page"><ChevronRight /></button></div></div>}
      </section>
      {modalOpen && <Modal title={editing ? `Edit ${editing.orderNumber}` : "New work order"} onClose={() => { setModalOpen(false); setSearchParams({}); }} wide>
        <form className="form-grid essential-order-form" onSubmit={submit}>
          <label>Customer<select value={form.customer} onChange={(e) => updateCustomer(e.target.value)} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
          <label>Vehicle<select value={form.vehicle} onChange={(e) => updateVehicle(e.target.value)} required><option value="">Select vehicle</option>{customerVehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.plate ? `- ${vehicle.plate}` : ""}</option>)}</select></label>
          <label className="span-2">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <div className="span-2 service-editor">
            <div className="service-heading">
              <strong>Services and parts</strong>
              <button type="button" className="text-button" onClick={() => setForm({ ...form, services: [...form.services, { description: "", quantity: 1, price: 0, cost: 0 }] })}>+ Add line</button>
            </div>
            <div className="service-row service-labels"><span>Description</span><span>Qty</span><span>Price</span><span /></div>
            {form.services.map((item, index) => <div className="service-row" key={index}>
              <input aria-label="Description" placeholder="Description" value={item.description} onChange={(e) => updateService(index, "description", e.target.value)} />
              <input aria-label="Quantity" type="number" min="0" step="0.1" value={item.quantity} onChange={(e) => updateService(index, "quantity", Number(e.target.value))} />
              <input aria-label="Price" type="number" min="0" step="0.01" value={item.price} onChange={(e) => updateService(index, "price", Number(e.target.value))} />
              <button type="button" className="remove-line" onClick={() => setForm({ ...form, services: form.services.filter((_, i) => i !== index) })} disabled={form.services.length === 1}>x</button>
            </div>)}
          </div>
          <label>Labor<input type="number" min="0" step="0.01" value={form.labor} onChange={(e) => setForm({ ...form, labor: Number(e.target.value) })} /></label>
          <label>Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} /></label>
          <label className="span-2">Payment method<select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <label className="span-2">Notes<textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="order-total span-2"><span>Estimated total</span><strong>{money.format(subtotal * (1 + Number(form.taxRate || 0) / 100))}</strong></div>
          <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => { setModalOpen(false); setSearchParams({}); }}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save work order"}</button></div>
        </form>
      </Modal>}
    </div>
  );
}
