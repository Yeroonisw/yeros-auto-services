import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CarFront, Download, Hash, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const labels = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };

export default function WorkOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [error, setError] = useState("");

  async function loadOrder() {
    try {
      const { data } = await api.get(`/work-orders/${id}`);
      setOrder(data);
      setStatus(data.status);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  useEffect(() => { loadOrder(); }, [id]);

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
        <button className="button primary" onClick={downloadInvoice}><Download size={16} /> Download invoice</button>
      </div>
      <section className="detail-hero">
        <div>
          <p className="eyebrow">Work order</p>
          <h1>{order.orderNumber}</h1>
          <p>{order.customer?.name} · {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}</p>
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
        <article><CarFront /><span>Vehicle</span><strong>{order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}</strong><small>{order.vehicle?.plate || "No plate"} · {Number(order.vehicle?.mileage || 0).toLocaleString()} mi</small></article>
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
          <section className="panel internal-finance">
            <div className="panel-heading"><h2>Internal profitability</h2><p>Not shown on the customer invoice.</p></div>
            <div className="finance-breakdown">
              <div><span>Sales before tax</span><strong>{money.format(order.subtotal)}</strong></div>
              <div><span>Parts cost</span><strong>{money.format(order.partsCost || 0)}</strong></div>
              <div className="profit-row"><span>Gross profit</span><strong>{money.format(order.grossProfit ?? order.subtotal)}</strong></div>
            </div>
            <small className="internal-note">Gross profit does not include payroll, rent or other overhead expenses.</small>
          </section>
          <section className="panel detail-section">
            <div className="panel-heading"><h2>DTC codes</h2><p>Diagnostic codes recorded for this repair.</p></div>
            <div className="dtc-detail-list">
              {order.dtcCodes?.length ? order.dtcCodes.map((dtc, index) => <article key={index}><strong>{dtc.code}</strong><span>{dtc.description || "No description"}</span><small>{dtc.status}</small></article>) : <p className="detail-empty">No DTC codes recorded.</p>}
            </div>
          </section>
          <section className="panel detail-section">
            <div className="panel-heading"><h2>Notes</h2></div>
            <p className="detail-notes">{order.notes || "No notes recorded for this work order."}</p>
          </section>
          <section className="panel detail-section">
            <div className="panel-heading"><h2>Payment method</h2><p>Printed on the customer invoice.</p></div>
            <p className="detail-notes"><strong>{order.paymentMethod || "Pending"}</strong></p>
          </section>
          {order.sourceEstimate && <section className="source-estimate">Created from estimate <strong>{order.sourceEstimate.estimateNumber}</strong></section>}
        </aside>
      </div>
    </>}
  </div>;
}
