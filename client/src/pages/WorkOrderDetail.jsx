import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CarFront, Download, Hash, Plus, Save, UserRound, X } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const labels = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
const paymentMethods = ["Pending", "Cash", "Credit / Debit Card", "Zelle", "Cash App", "Check", "Other"];

function orderToForm(order) {
  return {
    customer: order.customer?._id || order.customer || "",
    vehicle: order.vehicle?._id || order.vehicle || "",
    status: order.status || "pending",
    services: order.services?.length ? order.services.map(({ description, quantity, price, cost }) => ({
      description: description || "",
      quantity: quantity || 1,
      price: price || 0,
      cost: cost || 0,
    })) : [{ description: "", quantity: 1, price: 0, cost: 0 }],
    labor: order.labor || 0,
    taxRate: order.taxRate || 0,
    paymentMethod: order.paymentMethod || "Pending",
    notes: order.notes || "",
  };
}

export default function WorkOrderDetail() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [editOpen, setEditOpen] = useState(searchParams.get("edit") === "1");
  const [form, setForm] = useState(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState("");

  async function loadOrder() {
    try {
      const { data } = await api.get(`/work-orders/${id}`);
      setOrder(data);
      setStatus(data.status);
      setForm(orderToForm(data));
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  useEffect(() => { loadOrder(); }, [id]);

  useEffect(() => {
    if (searchParams.get("edit") === "1" && order) {
      setForm(orderToForm(order));
      setEditOpen(true);
    }
  }, [searchParams, order]);

  async function saveStatus() {
    if (!status || status === order.status) return;
    setSavingStatus(true);
    setError("");
    try {
      await api.put(`/work-orders/${id}`, { status });
      await loadOrder();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSavingStatus(false);
    }
  }

  const subtotal = useMemo(() => {
    if (!form) return 0;
    return form.services.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0) + Number(form.labor || 0);
  }, [form]);

  function openEditor() {
    if (order) setForm(orderToForm(order));
    setEditOpen(true);
    setSearchParams({ edit: "1" });
  }

  function closeEditor() {
    if (order) setForm(orderToForm(order));
    setEditOpen(false);
    setSearchParams({});
  }

  function updateService(index, field, value) {
    setForm({ ...form, services: form.services.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) });
  }

  async function saveOrder(event) {
    event.preventDefault();
    setSavingOrder(true);
    setError("");
    try {
      await api.put(`/work-orders/${id}`, {
        ...form,
        services: form.services.filter((item) => item.description.trim()),
      });
      setEditOpen(false);
      setSearchParams({});
      await loadOrder();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSavingOrder(false);
    }
  }

  async function downloadInvoice() {
    try {
      const response = await api.get(`/work-orders/${id}/invoice`, { responseType: "blob" });
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

  if (!order && !error) return <div className="page"><Loading /></div>;

  return <div className="page order-detail-page">
    <Alert message={error} onClose={() => setError("")} />
    {order && <>
      <div className="detail-topbar">
        <Link className="back-link" to="/work-orders"><ArrowLeft size={17} /> Work orders</Link>
        <div className="detail-action-row">
          <button className="button primary" onClick={openEditor}>Edit order now</button>
          <button className="button primary" onClick={downloadInvoice}><Download size={16} /> Download invoice</button>
        </div>
      </div>
      {editOpen && form && <section className="panel work-order-editor-panel">
        <div className="panel-heading">
          <div><h2>Edit work order</h2><p>Update services, prices, labor, diagnostics, oil change and notes.</p></div>
          <button className="icon-button" type="button" onClick={closeEditor} aria-label="Close editor"><X size={17} /></button>
        </div>
        <form className="form-grid essential-order-form" onSubmit={saveOrder}>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label>Payment method<select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>{paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}</select></label>
          <div className="span-2 service-editor">
            <div className="service-heading">
              <strong>Services and parts</strong>
              <button type="button" className="text-button" onClick={() => setForm({ ...form, services: [...form.services, { description: "", quantity: 1, price: 0, cost: 0 }] })}><Plus size={13} /> Add line</button>
            </div>
            <div className="service-row service-labels"><span>Description</span><span>Qty</span><span>Price</span><span /></div>
            {form.services.map((item, index) => <div className="service-row" key={index}>
              <input aria-label="Description" placeholder="Description" value={item.description} onChange={(event) => updateService(index, "description", event.target.value)} />
              <input aria-label="Quantity" type="number" min="0" step="0.1" value={item.quantity} onChange={(event) => updateService(index, "quantity", Number(event.target.value))} />
              <input aria-label="Price" type="number" min="0" step="0.01" value={item.price} onChange={(event) => updateService(index, "price", Number(event.target.value))} />
              <button type="button" className="remove-line" onClick={() => setForm({ ...form, services: form.services.filter((_, itemIndex) => itemIndex !== index) })} disabled={form.services.length === 1}>x</button>
            </div>)}
          </div>
          <label>Labor<input type="number" min="0" step="0.01" value={form.labor} onChange={(event) => setForm({ ...form, labor: Number(event.target.value) })} /></label>
          <label>Tax rate (%)<input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(event) => setForm({ ...form, taxRate: Number(event.target.value) })} /></label>
          <label className="span-2">Notes<textarea rows="4" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
          <div className="order-total span-2"><span>Total</span><strong>{money.format(subtotal * (1 + Number(form.taxRate || 0) / 100))}</strong></div>
          <div className="form-actions span-2"><button type="button" className="button secondary" onClick={closeEditor}>Cancel</button><button className="button primary" disabled={savingOrder}><Save size={16} /> {savingOrder ? "Saving..." : "Save changes"}</button></div>
        </form>
      </section>}
      <section className="detail-hero">
        <div>
          <p className="eyebrow">Work order</p>
          <h1>{order.orderNumber}</h1>
          <p>{order.customer?.name} - {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}</p>
        </div>
        <div className="detail-status-editor">
          <span className={`status large ${order.status}`}>{labels[order.status]}</span>
          <label>
            <span>Change status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} disabled={savingStatus}>
              {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="button primary" onClick={saveStatus} disabled={savingStatus || status === order.status}>
            {savingStatus ? "Saving..." : "Save status"}
          </button>
        </div>
      </section>
      <section className="detail-summary-grid">
        <article><UserRound /><span>Customer</span><strong>{order.customer?.name}</strong><small>{order.customer?.phone}<br />{order.customer?.email}</small></article>
        <article><CarFront /><span>Vehicle</span><strong>{order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}</strong><small>{order.vehicle?.plate || "No plate"} - {Number(order.vehicle?.mileage || 0).toLocaleString()} mi</small></article>
        <article><Hash /><span>VIN</span><strong>{order.vehicle?.vin || "Not recorded"}</strong><small>{order.vehicle?.color || "Color not recorded"}</small></article>
        <article><CalendarDays /><span>Opened</span><strong>{new Date(order.openedAt).toLocaleDateString()}</strong><small>{order.completedAt ? `Completed ${new Date(order.completedAt).toLocaleDateString()}` : "Not completed"}</small></article>
      </section>
      <div className="detail-columns">
        <section className="panel detail-section">
          <div className="panel-heading"><h2>Services and parts</h2><p>Complete breakdown of this repair.</p></div>
          <div className="detail-lines">
            <div className="detail-line heading"><span>Description</span><span>Qty</span><span>Price</span><span>Amount</span></div>
            {order.services.length ? order.services.map((service, index) => <div className="detail-line" key={index}>
              <strong>{service.description}</strong><span>{service.quantity}</span><span>{money.format(service.price)}</span><span>{money.format(service.quantity * service.price)}</span>
            </div>) : <p className="detail-empty">No service lines recorded.</p>}
            {order.labor > 0 && <div className="detail-line labor"><strong>Labor</strong><span /><span /><span>{money.format(order.labor)}</span></div>}
          </div>
          <div className="detail-totals">
            <div><span>Subtotal</span><strong>{money.format(order.subtotal)}</strong></div>
            <div><span>Tax ({order.taxRate}%)</span><strong>{money.format(order.total - order.subtotal)}</strong></div>
            <div className="grand-total"><span>Total</span><strong>{money.format(order.total)}</strong></div>
          </div>
        </section>
        <aside className="detail-side">
          <section className="panel detail-section">
            <div className="panel-heading"><h2>Notes</h2></div>
            <p className="detail-notes">{order.notes || "No notes recorded for this work order."}</p>
          </section>
          <section className="panel detail-section">
            <div className="panel-heading"><h2>Payment method</h2><p>Printed on the customer invoice.</p></div>
            <p className="detail-notes"><strong>{order.paymentMethod || "Pending"}</strong></p>
          </section>
        </aside>
      </div>
    </>}
  </div>;
}
