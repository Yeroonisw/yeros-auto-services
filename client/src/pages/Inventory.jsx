import { useEffect, useState } from "react";
import { AlertTriangle, Boxes, ChevronLeft, ChevronRight, DollarSign, PackagePlus, Pencil, Search } from "lucide-react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const emptyForm = { sku: "", name: "", category: "General", supplier: "", supplierPhone: "", quantity: 0, minimumStock: 2, cost: 0, salePrice: 0, location: "" };

export default function Inventory() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { data: response } = await api.get("/inventory", { params: { page, limit: 20, search: query } });
      setData(response);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }
  useEffect(() => { load(); }, [page, query]);

  function edit(item) {
    setEditing(item);
    setForm(Object.fromEntries(Object.keys(emptyForm).map((key) => [key, item[key] ?? emptyForm[key]])));
    setOpen(true);
  }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      if (editing) await api.put(`/inventory/${editing._id}`, form);
      else await api.post("/inventory", form);
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }
  async function adjust(item, amount) {
    try {
      await api.post(`/inventory/${item._id}/adjust`, { amount });
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return <div className="page business-module">
    <Alert message={error} onClose={() => setError("")} />
    <header className="module-hero">
      <div><span className="eyebrow">Parts control</span><h1>Inventory & profitability</h1><p>Know what is available, what needs ordering and the real margin on every part.</p></div>
      <button className="button primary" onClick={() => { setEditing(null); setForm(emptyForm); setOpen(true); }}><PackagePlus /> Add part</button>
    </header>
    {data ? <>
      <section className="business-kpis">
        <article><Boxes /><span>Units available</span><strong>{data.summary.units || 0}</strong></article>
        <article className={data.summary.lowStock ? "attention" : ""}><AlertTriangle /><span>Low stock alerts</span><strong>{data.summary.lowStock || 0}</strong></article>
        <article><DollarSign /><span>Inventory cost</span><strong>{money.format(data.summary.inventoryValue || 0)}</strong></article>
        <article><DollarSign /><span>Potential sales</span><strong>{money.format(data.summary.potentialRevenue || 0)}</strong></article>
      </section>
      <form className="module-toolbar" onSubmit={(event) => { event.preventDefault(); setPage(1); setQuery(search); }}>
        <label><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Part, SKU or supplier" /></label>
        <button className="button secondary">Search</button>
      </form>
      <section className="solid-table-card">
        {data.items.length ? <div className="table-scroll"><table><thead><tr><th>Part</th><th>Stock</th><th>Supplier</th><th>Cost</th><th>Sale</th><th>Profit</th><th>Actions</th></tr></thead>
          <tbody>{data.items.map((item) => <tr key={item._id} className={item.lowStock ? "low-stock-row" : ""}>
            <td><strong>{item.name}</strong><small>{item.sku} · {item.category}</small></td>
            <td><span className={`stock-pill ${item.lowStock ? "low" : "ok"}`}>{item.quantity} / min {item.minimumStock}</span></td>
            <td>{item.supplier || "—"}<small>{item.location || "No location"}</small></td>
            <td>{money.format(item.cost)}</td><td>{money.format(item.salePrice)}</td><td><strong>{money.format(item.unitProfit)}</strong></td>
            <td><div className="row-actions"><button title="Use one" onClick={() => adjust(item, -1)} disabled={!item.quantity}>−</button><button title="Receive one" onClick={() => adjust(item, 1)}>+</button><button title="Edit" onClick={() => edit(item)}><Pencil /></button></div></td>
          </tr>)}</tbody></table></div> : <Empty title="No parts found" text="Add the first inventory item or change your search." />}
        <footer className="pagination"><span>Page {data.pagination.page} of {data.pagination.pages} · {data.pagination.total} parts</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft /></button><button disabled={page >= data.pagination.pages} onClick={() => setPage(page + 1)}><ChevronRight /></button></div></footer>
      </section>
    </> : <Loading />}

    {open && <Modal title={editing ? "Edit part" : "Add inventory part"} onClose={() => setOpen(false)}>
      <form className="form-grid" onSubmit={save}>
        <label>SKU<input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required /></label>
        <label>Part name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
        <label>Category<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
        <label>Supplier<input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></label>
        <label>Supplier phone<input value={form.supplierPhone} onChange={(e) => setForm({ ...form, supplierPhone: e.target.value })} /></label>
        <label>Storage location<input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
        <label>Quantity<input type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></label>
        <label>Low stock at<input type="number" min="0" value={form.minimumStock} onChange={(e) => setForm({ ...form, minimumStock: Number(e.target.value) })} /></label>
        <label>Unit cost<input type="number" min="0" step=".01" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} /></label>
        <label>Sale price<input type="number" min="0" step=".01" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} /></label>
        <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save part"}</button></div>
      </form>
    </Modal>}
  </div>;
}
