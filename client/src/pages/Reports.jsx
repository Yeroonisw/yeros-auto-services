import { useEffect, useState } from "react";
import { Download, DollarSign, FileSpreadsheet, TrendingUp } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const first = `${new Date().getFullYear()}-01-01`; const today = new Date().toISOString().slice(0, 10);
export default function Reports() {
  const [range, setRange] = useState({ from: first, to: today }); const [data, setData] = useState(null); const [error, setError] = useState("");
  async function load() { try { setData((await api.get("/reports/summary", { params: range })).data); } catch (e) { setError(errorMessage(e)); } }
  useEffect(() => { load(); }, []);
  async function download(path, name) { try { const response = await api.get(path, { params: range, responseType: "blob" }); const url = URL.createObjectURL(response.data); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); } catch (e) { setError(errorMessage(e)); } }
  if (!data) return <Loading />;
  return <div className="page business-module"><Alert message={error} onClose={() => setError("")} /><header className="module-hero"><div><span className="eyebrow">Accounting intelligence</span><h1>Reports & exports</h1><p>Measure profitability, collections and growth, then export clean accounting files.</p></div><div className="hero-count"><FileSpreadsheet />Tax-ready exports</div></header>
    <form className="report-range" onSubmit={(e) => { e.preventDefault(); load(); }}><label>From<input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} /></label><label>To<input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></label><button className="button primary">Refresh</button></form>
    <section className="business-kpis"><article><DollarSign /><span>Total sales</span><strong>{money.format(data.sales)}</strong></article><article><TrendingUp /><span>Net profit</span><strong>{money.format(data.netProfit)}</strong></article><article><DollarSign /><span>Collected</span><strong>{money.format(data.collected)}</strong></article><article className={data.outstanding ? "attention" : ""}><DollarSign /><span>Outstanding</span><strong>{money.format(data.outstanding)}</strong></article></section>
    <section className="report-downloads solid-panel"><header><FileSpreadsheet /><div><h2>Download your business data</h2><p>CSV files open in Excel, Google Sheets and accounting systems.</p></div></header><div><button className="button secondary" onClick={() => download("/reports/transactions.csv", "Yeros-transactions.csv")}><Download />Transactions</button><button className="button secondary" onClick={() => download("/reports/customers.csv", "Yeros-customers.csv")}><Download />Customer list</button></div><footer><span>{data.completedOrders} completed orders</span><span>{data.newCustomers} new customers</span><span>{money.format(data.operating)} operating expenses</span></footer></section>
  </div>;
}
