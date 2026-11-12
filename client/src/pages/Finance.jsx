import { useEffect, useState } from "react";
import { Banknote, CalendarDays, CheckCircle2, CircleDollarSign, Clock3, CreditCard, Plus, Receipt, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";
import "./finance.css";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const today = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
const localMonth = () => today().slice(0, 7);
const displayDate = (value) => new Intl.DateTimeFormat("es-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
const expenseBlank = () => ({ category: "fuel", description: "", amount: 0, date: today(), vendor: "", paymentMethod: "" });
const paymentBlank = { customer: "", workOrder: "", type: "invoice", amount: 0, method: "cash", status: "paid", reference: "" };
const billBlank = () => ({ vendor: "", description: "", category: "rent", amount: 0, dueDate: today(), status: "pending", paymentMethod: "", reference: "" });
const categoryNames = { fuel: "Combustible", tools: "Herramientas", payroll: "Nómina", insurance: "Seguro", rent: "Renta", parts: "Piezas", marketing: "Publicidad", software: "Software", taxes: "Impuestos", other: "Otro" };
const methodNames = { cash: "Efectivo", card: "Tarjeta", zelle: "Zelle", cash_app: "Cash App", check: "Cheque", online: "En línea", other: "Otro" };

function monthRange(month) {
  const [year, number] = month.split("-").map(Number);
  return { from: month + "-01", to: month + "-" + String(new Date(year, number, 0).getDate()).padStart(2, "0") };
}

export default function Finance() {
  const [data, setData] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [month, setMonth] = useState(localMonth);
  const [modal, setModal] = useState("");
  const [expense, setExpense] = useState(expenseBlank);
  const [payment, setPayment] = useState(paymentBlank);
  const [bill, setBill] = useState(billBlank);
  const [settlingBill, setSettlingBill] = useState(null);
  const [billPayment, setBillPayment] = useState({ paidAt: today(), paymentMethod: "Wells Fargo" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const range = monthRange(month);
      const [financeResponse, customerResponse, orderResponse] = await Promise.all([
        api.get("/finance", { params: range }),
        api.get("/customers"),
        api.get("/work-orders"),
      ]);
      setData(financeResponse.data);
      setCustomers(customerResponse.data);
      setOrders(orderResponse.data);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  useEffect(() => { load(); }, [month]);

  async function submit(action, body) {
    setSaving(true);
    let succeeded = false;
    try {
      await action(body);
      setModal("");
      await load();
      succeeded = true;
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSaving(false); }
    return succeeded;
  }
  async function saveExpense(event) {
    event.preventDefault();
    if (await submit((body) => api.post("/finance/expenses", body), expense)) setExpense(expenseBlank());
  }
  async function savePayment(event) {
    event.preventDefault();
    if (await submit((body) => api.post("/finance/payments", body), { ...payment, workOrder: payment.workOrder || null })) setPayment(paymentBlank);
  }
  async function saveBill(event) {
    event.preventDefault();
    if (await submit((body) => api.post("/finance/bills", body), bill)) setBill(billBlank());
  }
  async function markBillPaid(item) {
    setSettlingBill(item);
    setBillPayment({ paidAt: today(), paymentMethod: item.paymentMethod || "Wells Fargo" });
    setModal("billPayment");
  }
  async function confirmBillPaid(event) {
    event.preventDefault();
    if (await submit((body) => api.patch("/finance/bills/" + settlingBill._id, body), { ...billPayment, status: "paid" })) setSettlingBill(null);
  }

  const monthLabel = new Intl.DateTimeFormat("es-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "-01T12:00:00Z"));
  return <div className="page business-module finance-page finance-workspace">
    <Alert message={error} onClose={() => setError("")} />
    <header className="finance-hero">
      <div><span className="eyebrow">Yeros Auto Services</span><h1>Control financiero</h1><p>Ingresos, gastos y pagos del negocio en un solo lugar.</p></div>
      <label className="finance-month"><CalendarDays size={17} /><span>Mes</span><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} aria-label="Seleccionar mes" /></label>
    </header>

    {!data ? <Loading /> : <>
      <div className="finance-month-caption">Resumen de {monthLabel}</div>
      <section className="finance-kpis">
        <article><CircleDollarSign /><span>Ingresos cobrados</span><strong>{money.format(data.summary.collected)}</strong><small>Pagos de clientes registrados</small></article>
        <article><Banknote /><span>Ventas completadas</span><strong>{money.format(data.summary.sales)}</strong><small>Órdenes completadas en el mes</small></article>
        <article><TrendingDown /><span>Gastos pagados</span><strong>{money.format(data.summary.operatingExpenses)}</strong><small>Incluye facturas marcadas como pagadas</small></article>
        <article className={data.summary.netProfit >= 0 ? "positive" : "negative"}><TrendingUp /><span>Neto estimado</span><strong>{money.format(data.summary.netProfit)}</strong><small>Ventas menos piezas y gastos</small></article>
      </section>

      <section className="finance-actions-row">
        <div><h2>Movimientos y pagos</h2><p>Registra lo recibido, lo pagado y lo que todavía vence.</p></div>
        <div className="finance-actions">
          <button className="button secondary" onClick={() => setModal("expense")}><Receipt size={17} />Registrar gasto</button>
          <button className="button secondary" onClick={() => setModal("bill")}><Clock3 size={17} />Agregar pago pendiente</button>
          <button className="button primary" onClick={() => setModal("payment")}><CreditCard size={17} />Registrar ingreso</button>
        </div>
      </section>

      <section className="finance-payable-summary">
        <article><WalletCards /><div><span>Total de pagos pendientes</span><strong>{money.format(data.summary.unpaidBills || 0)}</strong></div></article>
        <article className={(data.summary.overdueBills || 0) ? "is-overdue" : ""}><Clock3 /><div><span>Pagos vencidos</span><strong>{data.summary.overdueBills || 0}</strong></div></article>
        <p>Los pagos pendientes solo se registran aquí. Al marcarlos como pagados, se agregan a los gastos en la fecha de pago.</p>
      </section>

      <section className="finance-grid">
        <article className="solid-panel">
          <header><Receipt /><div><h2>Gastos del mes</h2><p>Compras y facturas efectivamente pagadas.</p></div></header>
          {data.expenses.length ? <div className="finance-list">{data.expenses.map((item) => <div key={item._id}><span className="expense-category">{categoryNames[item.category] || item.category}</span><div><strong>{item.description}</strong><small>{item.vendor || "Sin proveedor"} · {displayDate(item.date)}</small></div><b>{money.format(item.amount)}</b></div>)}</div> : <Empty>No hay gastos registrados en este mes.</Empty>}
        </article>
        <article className="solid-panel">
          <header><WalletCards /><div><h2>Ingresos recibidos</h2><p>Depósitos y pagos de clientes del mes.</p></div></header>
          {data.payments.length ? <div className="finance-list">{data.payments.map((item) => <div key={item._id}><span className="payment-method">{methodNames[item.method] || item.method}</span><div><strong>{item.customer?.name || "Cliente"}</strong><small>{item.workOrder?.orderNumber || (item.type === "deposit" ? "Depósito" : item.type === "refund" ? "Reembolso" : "Pago de factura")} · {item.status === "paid" ? "Recibido" : item.status === "refunded" ? "Reembolsado" : "Pendiente"}</small></div><b>{item.type === "refund" || item.status === "refunded" ? "−" : ""}{money.format(item.amount)}</b></div>)}</div> : <Empty>No hay ingresos registrados en este mes.</Empty>}
        </article>
      </section>

      <section className="solid-panel finance-bills">
        <header><Clock3 /><div><h2>Pagos por hacer</h2><p>Facturas y compromisos con su fecha de vencimiento. Los vencidos aparecen resaltados.</p></div><button className="button secondary compact" onClick={() => { setBill(billBlank()); setModal("bill"); }}><Plus size={15} />Agregar pago</button></header>
        {data.bills?.length ? <div className="finance-bill-list">{data.bills.map((item) => {
          const overdue = item.status !== "paid" && String(item.dueDate).slice(0, 10) < today();
          return <article key={item._id} className={overdue ? "overdue" : ""}>
            <div className="bill-due">{overdue ? "Vencido" : item.status === "paid" ? "Pagado" : "Vence"}<strong>{displayDate(item.dueDate)}</strong></div>
            <div className="bill-description"><strong>{item.vendor}</strong><span>{item.description} · {categoryNames[item.category] || item.category}</span></div>
            <b className="bill-amount">{money.format(item.amount)}</b>
            {item.status === "paid" ? <span className="bill-status paid"><CheckCircle2 size={14} />Pagado</span> : <button className="text-button" disabled={saving} onClick={() => markBillPaid(item)}>Marcar pagado</button>}
          </article>;
        })}</div> : <Empty>No hay pagos pendientes ni pagos registrados para este mes.</Empty>}
      </section>

      <section className="solid-panel category-spend"><h2>Gastos por categoría</h2><div>{Object.entries(data.summary.categories || {}).map(([category, amount]) => <article key={category}><span>{categoryNames[category] || category}</span><strong>{money.format(amount)}</strong><i style={{ width: String(Math.min(100, amount / Math.max(...Object.values(data.summary.categories), 1) * 100)) + "%" }} /></article>)}</div></section>
      <p className="finance-reconcile-note">Wells Fargo: registra tus movimientos manualmente y compáralos con el extracto bancario. Esta pantalla no se conecta al banco ni mueve dinero.</p>
    </>}

    {modal === "expense" && <Modal title="Registrar gasto pagado" onClose={() => setModal("")}><form className="form-grid" onSubmit={saveExpense}>
      <label>Categoría<select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>{Object.entries(categoryNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Descripción<input value={expense.description} onChange={(e) => setExpense({ ...expense, description: e.target.value })} required /></label>
      <label>Monto ($)<input type="number" min=".01" step=".01" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: Number(e.target.value) })} required /></label>
      <label>Fecha pagado<input type="date" value={expense.date} onChange={(e) => setExpense({ ...expense, date: e.target.value })} required /></label>
      <label>Proveedor<input value={expense.vendor} onChange={(e) => setExpense({ ...expense, vendor: e.target.value })} /></label>
      <label>Método de pago<input placeholder="Wells Fargo, tarjeta, Zelle..." value={expense.paymentMethod} onChange={(e) => setExpense({ ...expense, paymentMethod: e.target.value })} /></label>
      <div className="form-actions span-2"><button className="button primary" disabled={saving}>{saving ? "Guardando..." : "Guardar gasto"}</button></div>
    </form></Modal>}

    {modal === "bill" && <Modal title="Agregar pago pendiente" onClose={() => setModal("")}><form className="form-grid" onSubmit={saveBill}>
      <label>Proveedor<input value={bill.vendor} onChange={(e) => setBill({ ...bill, vendor: e.target.value })} required /></label>
      <label>Descripción<input value={bill.description} onChange={(e) => setBill({ ...bill, description: e.target.value })} placeholder="Renta de octubre, factura de piezas..." required /></label>
      <label>Categoría<select value={bill.category} onChange={(e) => setBill({ ...bill, category: e.target.value })}>{Object.entries(categoryNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Monto ($)<input type="number" min=".01" step=".01" value={bill.amount} onChange={(e) => setBill({ ...bill, amount: Number(e.target.value) })} required /></label>
      <label>Fecha de vencimiento<input type="date" value={bill.dueDate} onChange={(e) => setBill({ ...bill, dueDate: e.target.value })} required /></label>
      <label>Referencia<input value={bill.reference} onChange={(e) => setBill({ ...bill, reference: e.target.value })} /></label>
      <div className="form-actions span-2"><button className="button primary" disabled={saving}>{saving ? "Guardando..." : "Guardar pago pendiente"}</button></div>
    </form></Modal>}

    {modal === "billPayment" && settlingBill && <Modal title="Registrar pago realizado" onClose={() => setModal("")}><form className="form-grid" onSubmit={confirmBillPaid}>
      <div className="span-2 finance-payment-confirm"><strong>{settlingBill.vendor}</strong><span>{settlingBill.description}</span><b>{money.format(settlingBill.amount)}</b></div>
      <label>Fecha pagado<input type="date" value={billPayment.paidAt} onChange={(e) => setBillPayment({ ...billPayment, paidAt: e.target.value })} required /></label>
      <label>Método de pago<input value={billPayment.paymentMethod} onChange={(e) => setBillPayment({ ...billPayment, paymentMethod: e.target.value })} placeholder="Wells Fargo, cheque..." required /></label>
      <div className="span-2 finance-payment-disclaimer">Esto actualiza el registro de tu negocio; no inicia un pago desde Wells Fargo.</div>
      <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModal("")}>Cancelar</button><button className="button primary" disabled={saving}>{saving ? "Guardando..." : "Confirmar como pagado"}</button></div>
    </form></Modal>}

    {modal === "payment" && <Modal title="Registrar ingreso recibido" onClose={() => setModal("")}><form className="form-grid" onSubmit={savePayment}>
      <label>Cliente<select value={payment.customer} onChange={(e) => setPayment({ ...payment, customer: e.target.value })} required><option value="">Seleccionar cliente</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
      <label>Orden de trabajo<select value={payment.workOrder} onChange={(e) => setPayment({ ...payment, workOrder: e.target.value })}><option value="">Pago general</option>{orders.filter((order) => !payment.customer || (order.customer?._id || order.customer) === payment.customer).map((order) => <option key={order._id} value={order._id}>{order.orderNumber}</option>)}</select></label>
      <label>Tipo<select value={payment.type} onChange={(e) => setPayment({ ...payment, type: e.target.value })}><option value="deposit">Depósito</option><option value="invoice">Pago de factura</option><option value="refund">Reembolso</option></select></label>
      <label>Método<select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}>{Object.entries(methodNames).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Monto ($)<input type="number" min=".01" step=".01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: Number(e.target.value) })} required /></label>
      <label>Referencia<input value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} /></label>
      <div className="form-actions span-2"><button className="button primary" disabled={saving}>{saving ? "Guardando..." : "Guardar ingreso"}</button></div>
    </form></Modal>}
  </div>;
}
