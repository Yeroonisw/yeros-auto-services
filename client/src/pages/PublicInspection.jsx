import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, TriangleAlert, Wrench, XCircle } from "lucide-react";
import { useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";

export default function PublicInspection() {
  const { token } = useParams();
  const [inspection, setInspection] = useState(null);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  useEffect(() => { api.get(`/public/inspections/${token}`).then(({ data }) => setInspection(data)).catch((requestError) => setError(errorMessage(requestError))); }, [token]);
  async function decide(decision) {
    if (!signature.trim()) return setError("Enter your full name as your electronic signature.");
    try { const { data } = await api.post(`/public/inspections/${token}/decision`, { decision, signature }); setDone(data.message); } catch (requestError) { setError(errorMessage(requestError)); }
  }
  if (!inspection) return <div className="public-inspection"><p>{error || "Loading inspection..."}</p></div>;
  return <div className="public-inspection"><header><img src="/yeros-auto-logo.png" alt="Yeros Auto Services" /><span>Digital vehicle inspection</span></header><main><section className="inspection-public-hero"><div><small>{inspection.inspectionNumber}</small><h1>{inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}</h1><p>Prepared for {inspection.customer?.name} on {new Date(inspection.createdAt).toLocaleDateString()}</p></div><ShieldCheck /></section>
    <section className="public-findings">{inspection.items.map((item) => <article className={item.condition} key={item._id}><span>{item.condition === "good" ? <CheckCircle2 /> : item.condition === "urgent" ? <TriangleAlert /> : <Wrench />}</span><div><small>{item.category}</small><h2>{item.label}</h2><p>{item.notes || "No additional notes."}</p>{item.photoUrl && <img src={item.photoUrl} alt={item.label} loading="lazy" decoding="async" />}</div><b>{item.condition.replace("_", " ")}</b></article>)}</section>
    {inspection.summary && <section className="public-summary"><h2>Technician summary</h2><p>{inspection.summary}</p></section>}
    {done ? <div className="public-decision-done"><CheckCircle2 /><h2>{done}</h2><p>Yeros Auto Services has received your response.</p></div> : <section className="public-decision"><h2>Your decision</h2><p>Enter your full name as an electronic signature, then approve or decline the recommendations.</p>{error && <div className="form-error">{error}</div>}<input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Full legal name" /><div><button onClick={() => decide("declined")}><XCircle />Decline</button><button onClick={() => decide("approved")}><CheckCircle2 />Approve recommendations</button></div></section>}
  </main></div>;
}
