import { useEffect, useState } from "react";
import { ArrowLeft, Camera, Check, MessageCircle, Save, Wrench, TriangleAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const conditions = [["good", "Good"], ["attention", "Attention"], ["urgent", "Urgent"], ["not_checked", "Not checked"]];

async function imageData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => {
      const image = new Image(); image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas"); canvas.width = image.width * scale; canvas.height = image.height * scale;
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", .75));
      }; image.onerror = reject; image.src = reader.result;
    }; reader.onerror = reject; reader.readAsDataURL(file);
  });
}

export default function InspectionDetail() {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => { api.get(`/inspections/${id}`).then(({ data }) => setInspection(data)).catch((requestError) => setError(errorMessage(requestError))); }, [id]);
  function updateItem(index, values) { setInspection({ ...inspection, items: inspection.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item) }); }
  async function upload(index, file) {
    try { updateItem(index, { photoUrl: await imageData(file) }); } catch { setError("The photo could not be prepared."); }
  }
  async function save() {
    try { const { data } = await api.put(`/inspections/${id}`, { items: inspection.items, summary: inspection.summary, recommendedServices: inspection.items.filter((item) => ["attention", "urgent"].includes(item.condition)).map((item) => item.label), status: inspection.status }); setInspection(data); setMessage("Inspection saved."); } catch (requestError) { setError(errorMessage(requestError)); }
  }
  async function send() {
    try { await save(); const { data } = await api.post(`/inspections/${id}/send`); setInspection(data.inspection); if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank", "noopener,noreferrer"); else setMessage(`Customer link: ${data.publicUrl}`); } catch (requestError) { setError(errorMessage(requestError)); }
  }
  async function convert() {
    try { const { data } = await api.post(`/inspections/${id}/convert`); setMessage(`Work order ${data.orderNumber} created and waiting for approval.`); setInspection({ ...inspection, convertedWorkOrder: data._id }); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }
  if (!inspection) return <div className="page"><Alert message={error} /><Loading /></div>;
  return <div className="page business-module inspection-detail">
    <Alert message={error} onClose={() => setError("")} />{message && <div className="success-banner"><Check />{message}</div>}
    <Link className="back-link" to="/inspections"><ArrowLeft />Inspections</Link>
    <header className="module-hero"><div><span className="eyebrow">{inspection.inspectionNumber}</span><h1>{inspection.vehicle?.year} {inspection.vehicle?.make} {inspection.vehicle?.model}</h1><p>{inspection.customer?.name} · {Number(inspection.mileage || 0).toLocaleString()} miles</p></div><div className="inspection-actions"><button className="button secondary" onClick={save}><Save />Save</button><button className="button primary" onClick={send}><MessageCircle />Send to customer</button></div></header>
    <div className="inspection-checklist">{inspection.items.map((item, index) => <article className={item.condition} key={item._id || `${item.category}-${item.label}`}><div><small>{item.category}</small><h2>{item.label}</h2></div><div className="condition-buttons">{conditions.map(([value, label]) => <button className={item.condition === value ? "active" : ""} onClick={() => updateItem(index, { condition: value })} key={value}>{value === "urgent" && <TriangleAlert />}{label}</button>)}</div><textarea value={item.notes || ""} onChange={(e) => updateItem(index, { notes: e.target.value })} placeholder="Inspection notes..." /><label className="inspection-photo"><Camera />{item.photoUrl ? "Replace photo" : "Add photo"}<input type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files[0] && upload(index, e.target.files[0])} /></label>{item.photoUrl && <img src={item.photoUrl} alt={item.label} />}</article>)}</div>
    <section className="solid-panel inspection-summary"><h2>Customer summary</h2><textarea rows="4" value={inspection.summary || ""} onChange={(e) => setInspection({ ...inspection, summary: e.target.value })} placeholder="Explain the overall vehicle condition and recommended next steps." /><div className="form-actions"><button className="button secondary" onClick={save}><Save />Save inspection</button><button className="button primary" onClick={convert} disabled={Boolean(inspection.convertedWorkOrder)}><Wrench />{inspection.convertedWorkOrder ? "Work order created" : "Convert recommendations"}</button></div></section>
  </div>;
}
