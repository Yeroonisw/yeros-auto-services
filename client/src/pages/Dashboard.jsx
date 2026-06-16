import { useEffect, useState } from "react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const statusLabel = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard").then(({ data: response }) => setData(response)).catch((requestError) => setError(errorMessage(requestError)));
  }, []);

  if (!data && !error) return <div className="page"><Loading /></div>;

  const cards = [
    { label: "Customers", value: data?.customers || 0, accent: "blue" },
    { label: "Vehicles", value: data?.vehicles || 0, accent: "purple" },
    { label: "Active orders", value: data?.activeOrders || 0, accent: "orange" },
    { label: "Gross profit this month", value: money.format(data?.currentMonth?.grossProfit || 0), accent: "green" },
  ];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Dashboard</h1>
          <p>Here is what is happening in the shop today.</p>
        </div>
      </div>
      <Alert message={error} onClose={() => setError("")} />
      <section className="stats-grid">
        {cards.map((card) => (
          <article className={`stat-card ${card.accent}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>
      <section className="finance-grid">
        <article className="finance-card">
          <span>Sales this month</span>
          <strong>{money.format(data?.currentMonth?.revenue || 0)}</strong>
          <small>Charges before tax</small>
        </article>
        <article className="finance-card cost">
          <span>Parts cost this month</span>
          <strong>{money.format(data?.currentMonth?.partsCost || 0)}</strong>
          <small>Internal cost entered on completed orders</small>
        </article>
        <article className="finance-card profit">
          <span>Gross profit this month</span>
          <strong>{money.format(data?.currentMonth?.grossProfit || 0)}</strong>
          <small>Sales minus parts cost</small>
        </article>
      </section>
      <div className="finance-disclaimer">Gross profit is not net profit. It does not subtract payroll, rent, utilities, tools, insurance, card fees or other business expenses. Sales tax is excluded.</div>
      <section className="panel monthly-panel">
        <div className="panel-heading">
          <div><h2>Monthly financial summary</h2><p>Completed work orders grouped by completion month.</p></div>
        </div>
        {data?.monthly?.length ? <div className="table-wrap"><table>
          <thead><tr><th>Month</th><th>Orders</th><th>Sales</th><th>Parts cost</th><th>Gross profit</th><th>Margin</th></tr></thead>
          <tbody>{data.monthly.map((month) => <tr key={month.month}>
            <td><strong>{new Date(`${month.month}-02`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</strong></td>
            <td>{month.orders}</td><td>{money.format(month.revenue)}</td><td>{money.format(month.partsCost)}</td><td><strong>{money.format(month.grossProfit)}</strong></td>
            <td>{month.revenue ? `${((month.grossProfit / month.revenue) * 100).toFixed(1)}%` : "0%"}</td>
          </tr>)}</tbody>
        </table></div> : <div className="state-card compact">Complete a work order to begin the monthly report.</div>}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Recent work orders</h2>
            <p>Latest service activity across the shop.</p>
          </div>
        </div>
        {data?.recentOrders?.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td>{order.customer?.name}</td>
                    <td>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "-"}</td>
                    <td><span className={`status ${order.status}`}>{statusLabel[order.status]}</span></td>
                    <td>{money.format(order.total || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="state-card compact">No work orders yet.</div>}
      </section>
    </div>
  );
}
