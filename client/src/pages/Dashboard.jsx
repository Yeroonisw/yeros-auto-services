import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle, ArrowUpRight, BarChart3, BellRing, CalendarDays, CarFront, CheckCircle2,
  ChevronRight, CircleDollarSign, ClipboardList, FilePlus2, FileText, PackageSearch,
  Plus, RefreshCw, Sparkles, TrendingDown, TrendingUp, UserCheck, UsersRound, Wrench,
} from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const statusLabel = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };

function Delta({ value, inverse = false }) {
  const number = Number(value || 0);
  const positive = inverse ? number <= 0 : number >= 0;
  const Icon = number >= 0 ? TrendingUp : TrendingDown;
  return <span className={`template-delta ${positive ? "positive" : "negative"}`}><Icon />{Math.abs(number).toFixed(1)}%</span>;
}

function SectionHeading({ eyebrow, title, link, to }) {
  return <header className="template-section-heading"><div><span>{eyebrow}</span><h2>{title}</h2></div>{link && <Link to={to}>{link}<ChevronRight /></Link>}</header>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  async function load(refresh = false) {
    setRefreshing(true);
    try {
      const { data: response } = await api.get("/dashboard", { params: refresh ? { refresh: true } : {} });
      setData(response);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { load(); }, []);

  const chart = useMemo(() => {
    const months = (data?.monthly || []).slice(0, 6).reverse();
    const max = Math.max(...months.map((month) => Number(month.revenue || 0)), 1);
    return months.map((month) => ({
      ...month,
      height: Math.max(5, (Number(month.revenue || 0) / max) * 100),
      expenseHeight: Math.max(3, (Number(month.expenses || month.partsCost || 0) / max) * 100),
    }));
  }, [data]);

  if (!data && !error) return <div className="page"><Loading /></div>;

  const current = data?.currentMonth || {};
  const reminders = data?.reminders || { oilChanges: [], estimates: [], total: 0 };
  const upcoming = data?.upcomingAppointments || [];
  const profitRate = current.revenue ? Math.max(0, Math.min(100, ((current.grossProfit || 0) / current.revenue) * 100)) : 0;
  const attention = [
    ...(reminders.oilChanges || []).slice(0, 3).map((item) => ({ id: item._id, to: `/vehicles/${item._id}`, icon: BellRing, tone: item.status === "overdue" ? "danger" : "warning", title: item.vehicle, detail: `${item.customer?.name} · Oil change ${item.status === "overdue" ? "overdue" : "due soon"}` })),
    ...(reminders.estimates || []).slice(0, 2).map((item) => ({ id: item._id, to: "/estimates", icon: FileText, tone: "info", title: item.estimateNumber, detail: `${item.customer?.name} · Open ${item.ageDays} days` })),
    ...(data?.overdueOrders || []).slice(0, 2).map((item) => ({ id: item._id, to: `/work-orders/${item._id}`, icon: AlertTriangle, tone: "danger", title: item.orderNumber, detail: `${item.customer?.name} · Order overdue` })),
    ...(data?.lowStock || []).slice(0, 2).map((item) => ({ id: item._id, to: "/inventory", icon: PackageSearch, tone: "warning", title: item.name, detail: `${item.quantity} left · reorder at ${item.minimumStock}` })),
  ];

  return <div className="page template-dashboard">
    <Alert message={error} onClose={() => setError("")} />

    <section className="template-welcome">
      <div className="template-welcome-copy">
        <span className="template-kicker"><Sparkles /> YEROS AUTO SERVICES · LIVE OVERVIEW</span>
        <h1>Welcome back, Yeros <span>👋</span></h1>
        <p>Here’s what’s happening in your shop today.</p>
        <div className="template-welcome-meta"><span><i /> Operations online</span><span>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</span></div>
      </div>
      <div className="template-welcome-actions">
        <button onClick={() => load(true)} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} /> Refresh data</button>
        <Link to="/work-orders"><FilePlus2 /> New work order <ArrowUpRight /></Link>
      </div>
    </section>

    <section className="template-stat-grid" aria-label="Shop summary">
      <Link to="/customers" className="template-stat tone-violet"><span className="template-stat-icon"><UsersRound /></span><small>Customers</small><strong>{data?.customers || 0}</strong><span className="template-stat-foot">Customer records <ArrowUpRight /></span></Link>
      <Link to="/vehicles" className="template-stat tone-teal"><span className="template-stat-icon"><CarFront /></span><small>Vehicles</small><strong>{data?.vehicles || 0}</strong><span className="template-stat-foot">In your shop <ArrowUpRight /></span></Link>
      <Link to="/work-orders" className="template-stat tone-blue"><span className="template-stat-icon"><ClipboardList /></span><small>Active jobs</small><strong>{data?.activeOrders || 0}</strong><span className="template-stat-foot">Work in progress <ArrowUpRight /></span></Link>
      <Link to="/finance" className="template-stat tone-amber"><span className="template-stat-icon"><CircleDollarSign /></span><small>Monthly sales</small><strong>{money.format(current.revenue || 0)}</strong><span className="template-stat-foot"><Delta value={data?.comparison?.revenue} /> vs. last month</span></Link>
      <Link to="/finance" className="template-stat tone-green"><span className="template-stat-icon"><TrendingUp /></span><small>Gross profit</small><strong>{money.format(current.grossProfit || 0)}</strong><span className="template-stat-foot"><Delta value={data?.comparison?.grossProfit} /> vs. last month</span></Link>
      <Link to="/reminders" className="template-stat tone-rose"><span className="template-stat-icon"><BellRing /></span><small>Needs attention</small><strong>{reminders.total || 0}</strong><span className="template-stat-foot">Follow-ups due <ArrowUpRight /></span></Link>
    </section>

    <section className="template-dashboard-grid">
      <article className="template-panel template-revenue-panel">
        <SectionHeading eyebrow="PERFORMANCE" title="Revenue updates" link="Financial reports" to="/finance" />
        <div className="template-chart-summary"><strong>{money.format(current.revenue || 0)}</strong><span>Revenue this month</span><Delta value={data?.comparison?.revenue} /></div>
        <div className="template-revenue-chart">
          <div className="template-y-axis"><span>{money.format(Math.max(0, Math.round((Math.max(...chart.map((item) => Number(item.revenue || 0)), 1)) / 1000) * 1000))}</span><span>75%</span><span>50%</span><span>25%</span><span>$0</span></div>
          <div className="template-chart-columns">{chart.length ? chart.map((month) => <div className="template-chart-column" key={month.month}>
            <div className="template-bar-track"><i className="template-expense-bar" style={{ height: `${month.expenseHeight}%` }} /><i className="template-revenue-bar" style={{ height: `${month.height}%` }} /></div>
            <small>{new Date(`${month.month}-02`).toLocaleDateString("en-US", { month: "short" })}</small>
          </div>) : <div className="template-chart-empty">Complete a work order to start tracking revenue.</div>}</div>
        </div>
        <footer className="template-chart-legend"><span><i className="legend-revenue" /> Revenue</span><span><i className="legend-expenses" /> Parts &amp; expenses</span><b>{current.orders || 0} completed jobs this month</b></footer>
      </article>

      <div className="template-side-stack">
        <article className="template-panel template-breakup-panel">
          <SectionHeading eyebrow="YEAR TO DATE" title="Profit breakup" link="View reports" to="/reports" />
          <div className="template-breakup-content"><div className="template-donut" style={{ "--donut-fill": `${profitRate}%` }}><div><strong>{profitRate.toFixed(0)}%</strong><small>gross margin</small></div></div><div className="template-breakup-legend"><div><i className="legend-violet" /><span>Revenue</span><strong>{money.format(data?.sales?.year?.revenue || 0)}</strong></div><div><i className="legend-teal" /><span>Gross profit</span><strong>{money.format(current.grossProfit || 0)}</strong></div><div><i className="legend-muted" /><span>Parts cost</span><strong>{money.format(current.partsCost || 0)}</strong></div></div></div>
        </article>
        <article className="template-panel template-earnings-panel">
          <SectionHeading eyebrow="THIS MONTH" title="Monthly earnings" />
          <strong>{money.format(current.netProfit ?? current.grossProfit ?? 0)}</strong><span>Net profit after recorded expenses</span>
          <div className="template-earnings-track"><i style={{ width: `${profitRate}%` }} /></div>
          <div className="template-earnings-foot"><span>Sales <b>{money.format(current.revenue || 0)}</b></span><span>Expenses <b>{money.format(current.operatingExpenses || 0)}</b></span></div>
        </article>
      </div>
    </section>

    <section className="template-lower-grid">
      <article className="template-panel template-activity-panel">
        <SectionHeading eyebrow="WORKSHOP ACTIVITY" title="Recent work orders" link="All work orders" to="/work-orders" />
        {data?.recentOrders?.length ? <div className="template-work-table-wrap"><table className="template-work-table"><thead><tr><th>Work order</th><th>Customer &amp; vehicle</th><th>Status</th><th>Total</th></tr></thead><tbody>{data.recentOrders.slice(0, 6).map((order) => <tr key={order._id}>
          <td><Link to={`/work-orders/${order._id}`} className="template-order-link"><span><Wrench /></span><strong>{order.orderNumber}</strong></Link></td>
          <td><strong>{order.customer?.name || "Customer"}</strong><small>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "Vehicle not set"}</small></td>
          <td><span className={`template-status ${order.status}`}>{statusLabel[order.status] || order.status}</span></td>
          <td><b>{money.format(order.total || 0)}</b></td>
        </tr>)}</tbody></table></div> : <div className="template-empty"><Wrench /><span>No work orders yet.</span></div>}
      </article>

      <article className="template-panel template-attention-panel">
        <SectionHeading eyebrow="ACTION CENTER" title="Needs attention" link="View reminders" to="/reminders" />
        <div className="template-attention-list">{attention.length ? attention.slice(0, 6).map((item) => { const Icon = item.icon; return <Link to={item.to} key={item.id}>
          <span className={`template-attention-icon ${item.tone}`}><Icon /></span><span className="template-attention-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight />
        </Link>; }) : <div className="template-all-clear"><CheckCircle2 /><strong>All clear</strong><span>No follow-ups need attention.</span></div>}</div>
      </article>
    </section>

    <section className="template-lower-grid">
      <article className="template-panel template-schedule-panel">
        <SectionHeading eyebrow="ON THE ROAD" title="Upcoming appointments" link="Full schedule" to="/appointments" />
        <div className="template-appointment-list">{upcoming.length ? upcoming.slice(0, 4).map((appointment) => <Link to={`/appointments/${appointment._id}`} key={appointment._id}>
          <span className="template-appointment-date"><CalendarDays /><small>{new Date(appointment.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</small></span><span className="template-appointment-copy"><strong>{appointment.title}</strong><small>{appointment.customer?.name}{appointment.location ? ` · ${appointment.location}` : ""}</small></span><b>{new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</b><ChevronRight />
        </Link>) : <div className="template-empty"><CalendarDays /><span>No appointments in the next seven days.</span></div>}</div>
      </article>

      <article className="template-panel template-services-panel">
        <SectionHeading eyebrow="BEST PERFORMERS" title="Top services" link="Reports" to="/reports" />
        <div className="template-service-list">{data?.topServices?.length ? data.topServices.slice(0, 5).map((service, index) => <div key={service.name}>
          <span className="template-service-rank">{String(index + 1).padStart(2, "0")}</span><span className="template-service-copy"><strong>{service.name}</strong><small>{service.jobs} jobs · {money.format(service.profit || 0)} profit</small></span><b>{money.format(service.revenue || 0)}</b>
        </div>) : <div className="template-empty"><BarChart3 /><span>No service data yet.</span></div>}</div>
      </article>
    </section>

    <nav className="template-quick-links" aria-label="Quick links"><span>QUICK ACCESS</span><Link to="/estimates"><Plus />New estimate</Link><Link to="/appointments"><CalendarDays />Book service</Link><Link to="/scanner-reports"><Plus />Import scan</Link><Link to="/assistant"><Sparkles />AI diagnostics</Link><Link to="/customers"><UserCheck />Add customer</Link></nav>
  </div>;
}