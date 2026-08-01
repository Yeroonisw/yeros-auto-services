import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, BellRing, CalendarDays, CarFront, CheckCircle2, ChevronRight,
  CircleDollarSign, ClipboardList, Clock3, FilePlus2, FileText, Plus, Sparkles,
  TrendingDown, TrendingUp, UserPlus, UsersRound, Wrench,
  AlertTriangle, BarChart3, CalendarCheck2, RefreshCw, UserCheck,
} from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const statusLabel = { pending: "Pending", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };

function Delta({ value, inverse = false }) {
  const number = Number(value || 0);
  const good = inverse ? number <= 0 : number >= 0;
  const Icon = number >= 0 ? TrendingUp : TrendingDown;
  return <span className={good ? "command-delta good" : "command-delta bad"}><Icon />{Math.abs(number).toFixed(1)}%</span>;
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
    const max = Math.max(...months.map((month) => month.revenue), 1);
    return months.map((month) => ({ ...month, height: Math.max(7, (month.revenue / max) * 100), expenseHeight: Math.max(4, ((month.expenses || month.partsCost || 0) / max) * 100) }));
  }, [data]);

  if (!data && !error) return <div className="page"><Loading /></div>;

  const current = data?.currentMonth || {};
  const reminders = data?.reminders || { oilChanges: [], estimates: [], total: 0 };
  const upcoming = data?.upcomingAppointments || [];

  return <div className="page command-dashboard">
    <Alert message={error} onClose={() => setError("")} />

    <section className="command-hero">
      <div className="command-intro">
        <p><span /> Live operations · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
        <h1>Today at<br />Yeros.</h1>
        <span>Everything that needs your attention, in one working view.</span>
      </div>
      <div className="command-actions">
        <Link to="/work-orders"><FilePlus2 />New work order</Link>
        <Link to="/appointments"><CalendarDays />Book service</Link>
        <Link to="/customers"><UserPlus />Add customer</Link>
        <button onClick={() => load(true)} disabled={refreshing}><RefreshCw className={refreshing ? "spin" : ""} />Refresh</button>
      </div>
      <aside className="daily-pulse">
        <header><span>Daily pulse</span><Sparkles /></header>
        <div className="pulse-main"><span>Sales this month</span><strong>{money.format(current.revenue || 0)}</strong><Delta value={data?.comparison?.revenue} /></div>
        <div className="pulse-row"><div><CalendarDays /><span>Today</span><strong>{data?.todayAppointments || 0}</strong></div><div><BellRing /><span>Follow-ups</span><strong>{reminders.total || 0}</strong></div></div>
      </aside>
    </section>

    <section className="command-layout">
      <main className="command-main">
        <section className="metric-ribbon">
          <article><span className="metric-symbol coral"><UsersRound /></span><div><small>Customers</small><strong>{data?.customers || 0}</strong></div><ArrowUpRight /></article>
          <article><span className="metric-symbol sage"><CarFront /></span><div><small>Vehicles</small><strong>{data?.vehicles || 0}</strong></div><ArrowUpRight /></article>
          <article><span className="metric-symbol gold"><ClipboardList /></span><div><small>Active jobs</small><strong>{data?.activeOrders || 0}</strong></div><ArrowUpRight /></article>
          <article><span className="metric-symbol dark"><CircleDollarSign /></span><div><small>Gross profit</small><strong>{money.format(current.grossProfit || 0)}</strong></div><Delta value={data?.comparison?.grossProfit} /></article>
        </section>

        <section className="period-performance">
          {Object.entries(data?.sales || {}).map(([period, values]) => <article key={period}>
            <span>{period}</span><strong>{money.format(values.revenue || 0)}</strong><small>{values.orders || 0} jobs · {money.format(values.netProfit ?? values.profit ?? 0)} net</small>
          </article>)}
        </section>

        <section className="command-workbench">
          <article className="command-card revenue-story">
            <header><div><span>Performance</span><h2>Revenue rhythm</h2></div><div className="revenue-total"><small>Current month</small><strong>{money.format(current.revenue || 0)}</strong></div></header>
            <div className="story-chart">{chart.length ? chart.map((month) => <div key={month.month}>
              <span className="story-value">{money.format(month.revenue)}</span>
              <div><i className="revenue-bar" style={{ height: `${month.height}%` }} /><i className="expense-bar" style={{ height: `${month.expenseHeight}%` }} /></div>
              <small>{new Date(month.month + "-02").toLocaleDateString("en-US", { month: "short" })}</small>
            </div>) : <div className="command-empty">Complete a work order to start the chart.</div>}</div>
            <footer><span><i className="revenue-dot" /> Revenue</span><span><i className="expense-dot" /> Parts & expenses</span><span>{current.orders || 0} completed jobs this month</span></footer>
          </article>

          <article className="command-card next-stop">
            <header><div><span>On the road</span><h2>Next stops</h2></div><Link to="/appointments">Full schedule <ChevronRight /></Link></header>
            <div className="stop-list">{upcoming.length ? upcoming.slice(0, 4).map((appointment, index) => <Link to={`/appointments/${appointment._id}`} key={appointment._id}>
              <span className="stop-line"><i />{index < upcoming.length - 1 && <b />}</span>
              <span className="stop-time">{new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
              <div><strong>{appointment.title}</strong><small>{appointment.customer?.name}{appointment.location ? ` · ${appointment.location}` : ""}</small></div>
              <ChevronRight />
            </Link>) : <div className="command-empty">No appointments in the next seven days.</div>}</div>
          </article>
        </section>

        <section className="business-insight-grid">
          <article className="command-card pipeline-card">
            <header><div><span>Appointment flow</span><h2>This month</h2></div><CalendarCheck2 /></header>
            <div>{[["scheduled", "Pending"], ["confirmed", "Confirmed"], ["completed", "Completed"], ["cancelled", "Cancelled"]].map(([key, label]) => <div key={key}><span>{label}</span><strong>{data?.appointmentStatus?.[key] || 0}</strong><i style={{ width: `${Math.min(100, (data?.appointmentStatus?.[key] || 0) * 12)}%` }} /></div>)}</div>
          </article>
          <article className="command-card customer-mix">
            <header><div><span>Customer health</span><h2>New vs. recurring</h2></div><UserCheck /></header>
            <div><article><strong>{data?.customerSegments?.new || 0}</strong><span>New this month</span></article><article><strong>{data?.customerSegments?.recurring || 0}</strong><span>Recurring</span></article><article><strong>{data?.customerSegments?.oneTime || 0}</strong><span>One-time</span></article></div>
          </article>
        </section>

        <section className="command-card recent-work">
          <header><div><span>Workshop activity</span><h2>Recent work</h2></div><Link to="/work-orders">All work orders <ChevronRight /></Link></header>
          {data?.recentOrders?.length ? <div className="recent-work-list">{data.recentOrders.map((order) => <Link to={`/work-orders/${order._id}`} key={order._id}>
            <div className="work-order-mark"><Wrench /></div>
            <div><strong>{order.orderNumber}</strong><small>{order.customer?.name}</small></div>
            <div><strong>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "Vehicle not set"}</strong><small>Vehicle</small></div>
            <span className={`status ${order.status}`}>{statusLabel[order.status]}</span>
            <b>{money.format(order.total || 0)}</b>
            <ChevronRight />
          </Link>)}</div> : <div className="command-empty">No work orders yet.</div>}
        </section>
      </main>

      <aside className="command-rail">
        <section className="priority-stack">
          <header><div><span>Action center</span><h2>Needs attention</h2></div><strong>{reminders.total || 0}</strong></header>
          <div>{reminders.oilChanges?.slice(0, 4).map((item) => <Link to={`/vehicles/${item._id}`} key={item._id}>
            <span className={`priority-icon ${item.status}`}><BellRing /></span><div><strong>{item.vehicle}</strong><small>{item.customer?.name} · Oil change {item.status === "overdue" ? "overdue" : "due soon"}</small></div><ChevronRight />
          </Link>)}
          {reminders.estimates?.slice(0, 3).map((item) => <Link to="/estimates" key={item._id}>
            <span className="priority-icon estimate"><FileText /></span><div><strong>{item.estimateNumber}</strong><small>{item.customer?.name} · Open {item.ageDays} days</small></div><ChevronRight />
          </Link>)}
          {data?.overdueOrders?.slice(0, 3).map((item) => <Link to={`/work-orders/${item._id}`} key={item._id}>
            <span className="priority-icon overdue"><AlertTriangle /></span><div><strong>{item.orderNumber}</strong><small>{item.customer?.name} · Order overdue</small></div><ChevronRight />
          </Link>)}
          {!reminders.total && <div className="all-clear"><CheckCircle2 /><strong>All clear</strong><span>No follow-ups need attention.</span></div>}</div>
        </section>

        <section className="rail-finance">
          <span>Money snapshot</span>
          <div><small>Sales</small><strong>{money.format(current.revenue || 0)}</strong></div>
          <div><small>Parts</small><strong>{money.format(current.partsCost || 0)}</strong></div>
          <div className="profit"><small>Gross profit</small><strong>{money.format(current.grossProfit || 0)}</strong></div>
          <div><small>Operating expenses</small><strong>{money.format(current.operatingExpenses || 0)}</strong></div>
          <div className="profit"><small>Net profit</small><strong>{money.format(current.netProfit ?? current.grossProfit ?? 0)}</strong></div>
          <p>Net profit includes recorded operating expenses.</p>
        </section>

        <section className="command-card service-leaders">
          <header><div><span>Best performers</span><h2>Top services</h2></div></header>
          <div>{data?.topServices?.length ? data.topServices.slice(0, 5).map((service, index) => <article key={service.name}>
            <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{service.name}</strong><small>{service.jobs} jobs · {money.format(service.profit || 0)} profit</small></div><b>{money.format(service.revenue)}</b>
          </article>) : <div className="command-empty">No service data yet.</div>}</div>
        </section>

        <section className="quick-launch">
          <span>Quick launch</span>
          <div><Link to="/estimates"><Plus /><span>Estimate</span></Link><Link to="/scanner-reports"><Plus /><span>Scan</span></Link><Link to="/assistant"><Plus /><span>AI help</span></Link></div>
        </section>
      </aside>
    </section>
  </div>;
}
