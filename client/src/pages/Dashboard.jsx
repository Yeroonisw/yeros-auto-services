import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BellRing, CalendarDays, CarFront, ChevronRight, ClipboardList, DollarSign, FilePlus2, FileText, Gauge, TrendingDown, TrendingUp, UserPlus, UsersRound, Wrench } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const statusLabel = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function Change({ value }) {
  const number = Number(value || 0);
  const positive = number >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return <small className={positive ? "metric-change positive" : "metric-change negative"}><Icon />{Math.abs(number).toFixed(1)}% vs last month</small>;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard").then(({ data: response }) => setData(response)).catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  if (!data && !error) return <div className="page"><Loading /></div>;

  const cards = [
    { label: "Customers", value: data?.customers || 0, accent: "blue", icon: UsersRound },
    { label: "Vehicles", value: data?.vehicles || 0, accent: "purple", icon: CarFront },
    { label: "Active orders", value: data?.activeOrders || 0, accent: "orange", icon: ClipboardList },
    { label: "Gross profit this month", value: money.format(data?.currentMonth?.grossProfit || 0), accent: "green", icon: TrendingUp },
  ];
  const activeOrders = data?.activeOrders || 0;
  const monthOrders = data?.currentMonth?.orders || 0;
  const maxMonthlyRevenue = Math.max(...(data?.monthly || []).map((month) => month.revenue), 1);

  return (
    <div className="page dashboard-page">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Operations hub</p>
          <h1>Welcome back, Yero</h1>
          <p>Track shop activity, current month performance and the latest service work from one place.</p>
        </div>
        <article className="dashboard-spotlight-card">
          <span><DollarSign size={16} /> Monthly sales</span>
          <strong>{money.format(data?.currentMonth?.revenue || 0)}</strong>
          <small>{monthOrders} completed orders</small>
        </article>
        <div className="dashboard-hero-actions">
          <Link className="button primary" to="/work-orders"><FilePlus2 size={16} /> New work order</Link>
          <Link className="button secondary" to="/customers"><UserPlus size={16} /> Add customer</Link>
          <Link className="button secondary" to="/estimates"><FileText size={16} /> Estimate</Link>
        </div>
      </section>

      <Alert message={error} onClose={() => setError("")} />

      <section className="dashboard-summary-strip">
        <span><CalendarDays size={15} /> {data?.todayAppointments || 0} appointments today</span>
        <span><ClipboardList size={15} /> {activeOrders} active orders</span>
        <span><BellRing size={15} /> {data?.reminders?.total || 0} follow-ups need attention</span>
      </section>

      <section className="stats-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return <article className={"stat-card " + card.accent} key={card.label}>
            <div className="stat-icon"><Icon size={19} /></div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>;
        })}
      </section>

      <section className="finance-grid">
        <article className="finance-card">
          <span>Sales this month</span>
          <strong>{money.format(data?.currentMonth?.revenue || 0)}</strong>
          <Change value={data?.comparison?.revenue} />
        </article>
        <article className="finance-card cost">
          <span>Parts cost this month</span>
          <strong>{money.format(data?.currentMonth?.partsCost || 0)}</strong>
          <small>Internal cost entered on completed orders</small>
        </article>
        <article className="finance-card profit">
          <span>Gross profit this month</span>
          <strong>{money.format(data?.currentMonth?.grossProfit || 0)}</strong>
          <Change value={data?.comparison?.grossProfit} />
        </article>
      </section>
      <div className="finance-disclaimer">Gross profit is not net profit. It does not subtract payroll, rent, utilities, tools, insurance, card fees or other business expenses. Sales tax is excluded.</div>

      <section className="insights-grid">
        <section className="panel revenue-trend-panel">
          <div className="panel-heading"><div><h2>Revenue trend</h2><p>Sales performance over the last six active months.</p></div><Gauge /></div>
          <div className="revenue-bars">{(data?.monthly || []).slice(0, 6).reverse().map((month) => <div key={month.month}>
            <div className="bar-track"><span style={{ height: `${Math.max(8, (month.revenue / maxMonthlyRevenue) * 100)}%` }} /></div>
            <strong>{money.format(month.revenue)}</strong>
            <small>{new Date(month.month + "-02").toLocaleDateString("en-US", { month: "short" })}</small>
          </div>)}</div>
        </section>

        <section className="panel top-services-panel">
          <div className="panel-heading"><div><h2>Top services</h2><p>Highest revenue service lines.</p></div><Wrench /></div>
          <div className="top-service-list">{data?.topServices?.length ? data.topServices.map((service, index) => <article key={service.name}>
            <span>{index + 1}</span><div><strong>{service.name}</strong><small>{service.jobs} jobs</small></div><b>{money.format(service.revenue)}</b>
          </article>) : <div className="state-card compact">Complete work orders to see top services.</div>}</div>
        </section>
      </section>

      <section className="operations-grid">
        <section className="panel agenda-panel">
          <div className="panel-heading"><div><h2>Next appointments</h2><p>Your upcoming mobile service schedule.</p></div><Link to="/appointments">Open calendar <ChevronRight /></Link></div>
          <div className="dashboard-agenda">{data?.upcomingAppointments?.length ? data.upcomingAppointments.map((appointment) => <article key={appointment._id}>
            <div className="agenda-date"><strong>{new Date(appointment.scheduledAt).toLocaleDateString("en-US", { day: "2-digit" })}</strong><span>{new Date(appointment.scheduledAt).toLocaleDateString("en-US", { month: "short" })}</span></div>
            <div><strong>{appointment.title}</strong><span>{appointment.customer?.name} · {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>{appointment.location && <small>{appointment.location}</small>}</div>
            <span className={`status appointment-${appointment.status}`}>{appointment.status.replace("_", " ")}</span>
          </article>) : <div className="state-card compact">No appointments in the next seven days.</div>}</div>
        </section>

        <section className="panel reminder-panel">
          <div className="panel-heading"><div><h2>Follow-up center</h2><p>Maintenance and estimate reminders.</p></div><BellRing /></div>
          <div className="reminder-list">
            {(data?.reminders?.oilChanges || []).slice(0, 4).map((item) => <Link to={`/vehicles/${item._id}`} key={item._id} className="reminder-item">
              <span className={`reminder-icon ${item.status}`}><AlertCircle /></span><div><strong>{item.vehicle}</strong><small>{item.customer?.name} · Oil change {item.status === "overdue" ? "overdue" : "due soon"}</small></div><ChevronRight />
            </Link>)}
            {(data?.reminders?.estimates || []).slice(0, 4).map((item) => <Link to="/estimates" key={item._id} className="reminder-item">
              <span className="reminder-icon estimate"><FileText /></span><div><strong>{item.estimateNumber} · {money.format(item.total || 0)}</strong><small>{item.customer?.name} · Open {item.ageDays} days</small></div><ChevronRight />
            </Link>)}
            {!data?.reminders?.total && <div className="state-card compact">Everything is up to date. No follow-ups needed.</div>}
          </div>
        </section>
      </section>

      <section className="dashboard-columns">
        <section className="panel monthly-panel">
          <div className="panel-heading">
            <div><h2>Monthly financial summary</h2><p>Completed work orders grouped by completion month.</p></div>
          </div>
          {data?.monthly?.length ? <div className="table-wrap"><table>
            <thead><tr><th>Month</th><th>Orders</th><th>Sales</th><th>Parts cost</th><th>Gross profit</th><th>Margin</th></tr></thead>
            <tbody>{data.monthly.map((month) => <tr key={month.month}>
              <td><strong>{new Date(month.month + "-02").toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong></td>
              <td>{month.orders}</td><td>{money.format(month.revenue)}</td><td>{money.format(month.partsCost)}</td><td><strong>{money.format(month.grossProfit)}</strong></td>
              <td>{month.revenue ? ((month.grossProfit / month.revenue) * 100).toFixed(1) + "%" : "0%"}</td>
            </tr>)}</tbody>
          </table></div> : <div className="state-card compact">Complete a work order to begin the monthly report.</div>}
        </section>

        <section className="panel recent-orders-panel">
          <div className="panel-heading">
            <div><h2>Recent work orders</h2><p>Latest service activity across the shop.</p></div>
          </div>
          {data?.recentOrders?.length ? <div className="table-wrap"><table>
            <thead><tr><th>Order</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Total</th></tr></thead>
            <tbody>{data.recentOrders.map((order) => <tr key={order._id}>
              <td><strong>{order.orderNumber}</strong></td>
              <td>{order.customer?.name}</td>
              <td>{order.vehicle ? order.vehicle.year + " " + order.vehicle.make + " " + order.vehicle.model : "-"}</td>
              <td><span className={"status " + order.status}>{statusLabel[order.status]}</span></td>
              <td>{money.format(order.total || 0)}</td>
            </tr>)}</tbody>
          </table></div> : <div className="state-card compact">No work orders yet.</div>}
        </section>
      </section>
    </div>
  );
}
