import { useEffect, useState } from "react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";

const emptyForm = { name: "", phone: "", email: "", address: "", notes: "" };

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  async function load(term = search) {
    setLoading(true);
    try {
      const { data } = await api.get("/customers", { params: term.trim() ? { search: term.trim() } : {} });
      setCustomers(data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(initialSearch); }, []);

  async function searchCustomers(event) {
    event.preventDefault();
    setSearchParams(search.trim() ? { search: search.trim() } : {});
    await load(search);
  }

  async function viewHistory(customer) {
    setHistoryLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/customers/${customer._id}/history`);
      setHistory(data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setHistoryLoading(false);
    }
  }

  function open(customer = null) {
    setEditing(customer);
    setForm(customer ? { name: customer.name, phone: customer.phone, email: customer.email || "", address: customer.address || "", notes: customer.notes || "" } : emptyForm);
    setModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing) await api.put(`/customers/${editing._id}`, form);
      else await api.post("/customers", form);
      setModalOpen(false);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function remove(customer) {
    if (!window.confirm(`Delete ${customer.name}?`)) return;
    try {
      await api.delete(`/customers/${customer._id}`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div><p className="eyebrow">Directory</p><h1>Customers</h1><p>Manage customer contact and service information.</p></div>
        <button className="button primary" onClick={() => open()}>+ New customer</button>
      </div>
      <Alert message={error} onClose={() => setError("")} />
      <section className="panel">
        <form className="customer-search" onSubmit={searchCustomers}>
          <input placeholder="Search by name, phone or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="button secondary">Search</button>
          {search && <button type="button" className="text-button" onClick={() => { setSearch(""); setSearchParams({}); load(""); }}>Clear</button>}
        </form>
        {loading ? <Loading /> : customers.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th className="actions">Actions</th></tr></thead>
              <tbody>{customers.map((customer) => (
                <tr key={customer._id}>
                  <td><button className="record-link" onClick={() => navigate(`/customers/${customer._id}`)}>{customer.name}</button></td><td>{customer.phone}</td><td>{customer.email || "-"}</td><td>{customer.address || "-"}</td>
                  <td className="actions"><button className="text-button view-button" onClick={() => navigate(`/customers/${customer._id}`)}>View</button><button className="text-button" onClick={() => viewHistory(customer)}>Quick history</button><button className="text-button" onClick={() => open(customer)}>Edit</button><button className="text-button danger" onClick={() => remove(customer)}>Delete</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty>No customers yet. Add the first customer to get started.</Empty>}
      </section>
      {modalOpen && (
        <Modal title={editing ? "Edit customer" : "New customer"} onClose={() => setModalOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label className="span-2">Full name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Phone<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
            <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="span-2">Address<input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className="span-2">Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows="3" /></label>
            <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save customer"}</button></div>
          </form>
        </Modal>
      )}
      {(history || historyLoading) && <Modal title={history ? `${history.customer.name} - Service history` : "Loading history"} onClose={() => { setHistory(null); setHistoryLoading(false); }} wide>
        {historyLoading ? <Loading /> : <div className="history-content">
          {!history.vehicles.length ? <Empty>No vehicles registered for this customer.</Empty> : history.vehicles.map((vehicle) => {
            const repairs = history.orders.filter((order) => (order.vehicle?._id || order.vehicle) === vehicle._id);
            return <section className="history-vehicle" key={vehicle._id}>
              <header>
                <div><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><span>{vehicle.plate || "No plate"} · {Number(vehicle.mileage || 0).toLocaleString()} mi</span></div>
                <small>{vehicle.vin || "VIN not set"}</small>
              </header>
              {repairs.length ? <div className="repair-list">{repairs.map((order) => <article className="repair-item" key={order._id}>
                <div><strong>{order.orderNumber}</strong><span>{new Date(order.openedAt).toLocaleDateString()} · {order.status.replace("_", " ")}</span></div>
                <ul>{order.services.length ? order.services.map((service, index) => <li key={index}>{service.description}</li>) : <li>No service lines recorded</li>}</ul>
                {order.dtcCodes?.length > 0 && <small>DTC: {order.dtcCodes.map((dtc) => dtc.code).join(", ")}</small>}
              </article>)}</div> : <p className="no-repairs">No repairs recorded for this vehicle.</p>}
            </section>;
          })}
        </div>}
      </Modal>}
    </div>
  );
}
