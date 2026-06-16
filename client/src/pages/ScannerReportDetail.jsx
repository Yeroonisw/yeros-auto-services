import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CarFront, ClipboardPlus, Download, FileScan, Gauge, Hash, UserRound } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

export default function ScannerReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/scanner-reports/${id}`);
      setReport(data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function downloadReport() {
    try {
      const response = await api.get(`/scanner-reports/${report._id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.download = report.reportFile?.fileName || `${report.reportNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  async function createWorkOrder() {
    try {
      await api.post(`/scanner-reports/${report._id}/work-order`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  if (loading) return <div className="page"><Loading /></div>;
  if (!report) return <div className="page"><Alert message={error} onClose={() => setError("")} /><Empty>Scanner report not found.</Empty></div>;

  return <div className="page">
    <Alert message={error} onClose={() => setError("")} />
    <div className="detail-topbar">
      <Link className="back-link" to="/scanner-reports"><ArrowLeft size={16} /> Back to scanner reports</Link>
      <div className="scanner-detail-actions">
        {report.reportFile?.fileName && <button className="button secondary" onClick={downloadReport}><Download size={16} /> Open PDF</button>}
        <button className="button primary" onClick={createWorkOrder} disabled={Boolean(report.convertedWorkOrder)}><ClipboardPlus size={16} /> {report.convertedWorkOrder ? report.convertedWorkOrder.orderNumber : "Create work order"}</button>
      </div>
    </div>

    <section className="detail-hero">
      <div>
        <p className="eyebrow">{report.scannerModel || "Scanner report"}</p>
        <h1>{report.reportNumber}</h1>
        <p>{report.summary || "Detailed scanner report history for this vehicle."}</p>
      </div>
      <span className="status large completed">{new Date(report.scanDate).toLocaleDateString()}</span>
    </section>

    <section className="detail-summary-grid">
      <article><UserRound /><span>Customer</span><strong>{report.customer?.name || "-"}</strong><small>{report.customer?.phone || report.customer?.email || ""}</small></article>
      <article><CarFront /><span>Vehicle</span><strong>{report.vehicle ? `${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}` : "-"}</strong><small>{report.vehicle?.plate || report.vehicle?.vin || ""}</small></article>
      <article><Hash /><span>VIN</span><strong>{report.vin || report.vehicle?.vin || "-"}</strong><small>Stored with this scan</small></article>
      <article><Gauge /><span>Odometer reading</span><strong>{Number(report.mileage || report.vehicle?.mileage || 0).toLocaleString()} mi</strong><small>Vehicle mileage updates when this is newer</small></article>
    </section>

    <section className="detail-columns">
      <div className="panel">
        <div className="panel-heading"><h2>DTC codes</h2><p>PCM and BCM codes are shown first, followed by the remaining modules.</p></div>
        {report.dtcCodes?.length ? <div className="scanner-code-table">
          {report.dtcCodes.map((dtc, index) => <article key={`${dtc.code}-${index}`}>
            <strong>{dtc.code}</strong>
            <span>{dtc.module || "Module -"}</span>
            <p>{dtc.description || "No description captured."}</p>
            <small className={`status ${dtc.status || "active"}`}>{dtc.status || "active"}</small>
          </article>)}
        </div> : <p className="detail-empty">No DTC codes saved for this scan.</p>}
      </div>

      <aside className="detail-side">
        <div className="panel">
          <div className="panel-heading"><h2>Report file</h2><p>Original uploaded PDF and source details.</p></div>
          <div className="scanner-file-panel">
            <FileScan />
            <strong>{report.reportFile?.fileName || report.sourceFileName || "No PDF uploaded"}</strong>
            <span>{report.reportFile?.size ? `${Math.round(report.reportFile.size / 1024).toLocaleString()} KB` : "Manual scanner entry"}</span>
          </div>
        </div>
        <div className="panel raw-report-panel">
          <div className="panel-heading"><h2>Extracted text</h2><p>Text read from the scanner PDF.</p></div>
          {report.rawText ? <pre>{report.rawText}</pre> : <p className="detail-empty">No raw report text available.</p>}
        </div>
      </aside>
    </section>
  </div>;
}
