import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CarFront, ClipboardList, FileText, KeyRound, Mail, MapPin, MessageCircle, Phone, PhoneCall, Send, StickyNote, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function CustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [interaction, setInteraction] = useState({ type: "note", direction: "internal", note: "" });
  const [portalAccess, setPortalAccess] = useState(null);

  useEffect(() => {
    api.get(`/customers/${id}`).then(({ data: response }) => setData(response)).catch((requestError) => setError(errorMessage(requestError)));
  }, [id]);

  if (!data && !error) return <div className="page"><Loading /></div>;
  const totalSpent = data?.insights?.totalSpent || 0;
  async function addInteraction(event) {
    event.preventDefault();
    try {
      const { data: created } = await api.post(`/customers/${id}/interactions`, interaction);
      setData({ ...data, interactions: [created, ...(data.interactions || [])] });
      setInteraction({ type: "note", direction: "internal", note: "" });
    } catch (requestError) { setError(errorMessage(requestError)); }
  }
  function whatsapp() {
    const phone = data.customer.phone.replace(/\D/g, "");
    const next = data.insights?.nextMaintenance;
    const maintenance = next ? ` Your ${next.vehicle.year} ${next.vehicle.make} ${next.vehicle.model} is coming due for maintenance.` : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`Hello ${data.customer.name}, this is Yeros Auto Services.${maintenance} How can we help you?`)}`, "_blank", "noopener,noreferrer");
  }
  async function enablePortal() {
    try {
      const { data: access } = await api.post(`/customers/${id}/portal-access`);
      setPortalAccess(access);
    } catch (requestError) { setError(errorMessage(requestError)); }
  }

  return <div className="page">
    <Alert message={error} onClose={() => setError("")} />
    {data && <>
      <div className="detail-topbar"><Link className="back-link" to="/customers"><ArrowLeft size={17} /> Customers</Link></div>
      <section className="detail-hero customer-hero">
        <div><p className="eyebrow">Customer profile</p><h1>{data.customer.name}</h1><p>Customer since {new Date(data.customer.createdAt).toLocaleDateString()}</p></div>
        <UserRound size={46} strokeWidth={1.4} />
      </section>
      <section className="detail-summary-grid">
        <article><ClipboardList /><span>Total visits</span><strong>{data.insights?.visits || 0}</strong><small>{data.insights?.customerType?.replace("_", " ")} customer</small></article>
        <article><ClipboardList /><span>Lifetime spend</span><strong>{money.format(totalSpent)}</strong><small>{money.format(data.insights?.averageTicket || 0)} average ticket</small></article>
        <article><CarFront /><span>Last service</span><strong>{data.insights?.lastService?.orderNumber || "No service yet"}</strong><small>{data.insights?.lastService?.date ? new Date(data.insights.lastService.date).toLocaleDateString() : "—"}</small></article>
        <article><CalendarDays /><span>Next maintenance</span><strong>{data.insights?.nextMaintenance?.vehicle ? `${data.insights.nextMaintenance.vehicle.year} ${data.insights.nextMaintenance.vehicle.make}` : "Not scheduled"}</strong><small>{data.insights?.nextMaintenance?.status?.nextMileage ? `${Number(data.insights.nextMaintenance.status.nextMileage).toLocaleString()} mi` : "Add vehicle maintenance data"}</small></article>
      </section>
      <section className="customer-contact-bar"><a href={`tel:${data.customer.phone}`}><PhoneCall />Call</a><button onClick={whatsapp}><MessageCircle />WhatsApp reminder</button><button className="portal-access-button" onClick={enablePortal}><KeyRound />Portal access</button>{data.customer.email && <a href={`mailto:${data.customer.email}`}><Mail />Email</a>}<span><MapPin />{data.customer.address || "No address"}</span></section>
      {portalAccess && <section className="portal-access-result"><KeyRound /><div><span>Customer portal access code</span><strong>{portalAccess.code}</strong><small>Send this code once. Generating another code replaces it.</small></div>{portalAccess.whatsappUrl && <a href={portalAccess.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle />Send by WhatsApp</a>}</section>}
      <div className="profile-grid">
        <section className="panel profile-section">
          <div className="panel-heading"><h2><CarFront size={18} /> Vehicles</h2><p>{data.vehicles.length} registered vehicles.</p></div>
          {data.vehicles.length ? <div className="profile-list">{data.vehicles.map((vehicle) => <Link to={`/vehicles/${vehicle._id}`} key={vehicle._id}>
            <div><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><span>{vehicle.plate || "No plate"} · {vehicle.vin || "No VIN"}</span></div><small>{Number(vehicle.mileage || 0).toLocaleString()} mi</small>
          </Link>)}</div> : <Empty>No vehicles registered.</Empty>}
        </section>
        <section className="panel profile-section">
          <div className="panel-heading"><h2><FileText size={18} /> Estimates</h2><p>Quotes prepared for this customer.</p></div>
          {data.estimates.length ? <div className="profile-list">{data.estimates.map((estimate) => <Link to="/estimates" key={estimate._id}>
            <div><strong>{estimate.estimateNumber}</strong><span>{estimate.vehicle ? `${estimate.vehicle.year} ${estimate.vehicle.make} ${estimate.vehicle.model}` : "-"} · {estimate.status}</span></div><small>{money.format(estimate.total)}</small>
          </Link>)}</div> : <Empty>No estimates recorded.</Empty>}
        </section>
      </div>
      <section className="panel profile-section profile-orders">
        <div className="panel-heading"><h2><ClipboardList size={18} /> Repair history</h2><p>All work orders for this customer.</p></div>
        {data.orders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Vehicle</th><th>Services</th><th>Status</th><th>Total</th></tr></thead>
          <tbody>{data.orders.map((order) => <tr key={order._id}><td><Link className="record-link" to={`/work-orders/${order._id}`}>{order.orderNumber}</Link></td><td>{order.vehicle ? `${order.vehicle.year} ${order.vehicle.make} ${order.vehicle.model}` : "-"}</td><td>{order.services.map((item) => item.description).join(", ") || "-"}</td><td><span className={`status ${order.status}`}>{order.status.replace("_", " ")}</span></td><td>{money.format(order.total)}</td></tr>)}</tbody>
        </table></div> : <Empty>No repairs recorded.</Empty>}
      </section>
      <section className="customer-followup-grid">
        <article className="solid-panel">
          <div className="panel-heading"><h2><StickyNote size={18} /> Contact history</h2><p>Calls, messages and internal notes.</p></div>
          <form className="interaction-form" onSubmit={addInteraction}><select value={interaction.type} onChange={(e) => setInteraction({ ...interaction, type: e.target.value, direction: e.target.value === "note" ? "internal" : "outbound" })}><option value="note">Note</option><option value="call">Call</option><option value="whatsapp">WhatsApp</option><option value="sms">SMS</option><option value="email">Email</option></select><input value={interaction.note} onChange={(e) => setInteraction({ ...interaction, note: e.target.value })} placeholder="What happened?" required /><button title="Save interaction"><Send /></button></form>
          <div className="interaction-list">{data.interactions?.length ? data.interactions.map((item) => <div key={item._id}><span className={item.type}>{item.type === "call" ? <PhoneCall /> : item.type === "whatsapp" ? <MessageCircle /> : <StickyNote />}</span><div><strong>{item.note}</strong><small>{item.createdBy?.name || "Team"} · {new Date(item.occurredAt).toLocaleString()}</small></div></div>) : <Empty>No contact history yet.</Empty>}</div>
        </article>
        <article className="solid-panel contact-details"><div className="panel-heading"><h2>Contact information</h2><p>Best ways to reach this customer.</p></div><div><Phone /><span>Phone</span><strong>{data.customer.phone}</strong></div><div><Mail /><span>Email</span><strong>{data.customer.email || "Not recorded"}</strong></div><div><MapPin /><span>Address</span><strong>{data.customer.address || "Not recorded"}</strong></div></article>
      </section>
      {data.customer.notes && <section className="panel profile-notes"><div className="panel-heading"><h2>Customer notes</h2></div><p>{data.customer.notes}</p></section>}
    </>}
  </div>;
}
