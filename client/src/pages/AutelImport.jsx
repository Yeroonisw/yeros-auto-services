import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CarFront, CheckCircle, Cloud, ExternalLink, FileScan, Gauge, Upload, UserRound } from "lucide-react";
import api, { errorMessage } from "../api.js";
import { Alert, Loading } from "../components/PageState.jsx";

const autelCloudUrl = "https://cloud-us.autel.com";

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function AutelImport() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [fileData, setFileData] = useState("");
  const [preview, setPreview] = useState(null);
  const [customer, setCustomer] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [{ data: customerData }, { data: vehicleData }] = await Promise.all([
        api.get("/customers"),
        api.get("/vehicles"),
      ]);
      setCustomers(customerData);
      setVehicles(vehicleData);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const customerVehicles = useMemo(() => vehicles.filter((item) => (item.customer?._id || item.customer) === customer), [vehicles, customer]);
  const matchedVehicle = useMemo(() => {
    const vin = preview?.vin?.toUpperCase();
    if (!vin) return null;
    return vehicles.find((item) => item.vin?.toUpperCase() === vin) || null;
  }, [preview, vehicles]);

  useEffect(() => {
    if (!matchedVehicle) return;
    setVehicle(matchedVehicle._id);
    setCustomer(matchedVehicle.customer?._id || matchedVehicle.customer || "");
  }, [matchedVehicle]);

  async function parsePdf(uploadedFile) {
    setError("");
    setPreview(null);
    setFile(uploadedFile);
    setFileData("");
    if (!uploadedFile) return;
    try {
      if (uploadedFile.type !== "application/pdf") throw new Error("Only PDF scanner reports are supported");
      if (uploadedFile.size > 8 * 1024 * 1024) throw new Error("PDF report must be 8 MB or smaller");
      setParsing(true);
      const dataUrl = await readFileAsDataUrl(uploadedFile);
      const { data } = await api.post("/scanner-reports/preview", {
        reportFileData: dataUrl,
        reportFileName: uploadedFile.name,
      });
      setFileData(dataUrl);
      setPreview(data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setParsing(false);
    }
  }

  async function saveReport() {
    setError("");
    if (!preview || !fileData) return setError("Upload and preview a PDF first");
    if (!customer || !vehicle) return setError("Select the customer and vehicle for this report");
    setSaving(true);
    try {
      const { data } = await api.post("/scanner-reports", {
        customer,
        vehicle,
        scannerModel: "Autel MK900",
        scanDate: new Date().toISOString().slice(0, 10),
        vin: preview.vin,
        mileage: preview.mileage,
        dtcCodes: preview.dtcCodes || [],
        summary: preview.summary,
        rawText: preview.rawText,
        sourceFileName: preview.sourceFileName || file.name,
        reportFileName: file.name,
        reportFileData: fileData,
        autoFillFromPdf: false,
      });
      navigate(`/scanner-reports/${data._id}`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function changeCustomer(nextCustomer) {
    const firstVehicle = vehicles.find((item) => (item.customer?._id || item.customer) === nextCustomer);
    setCustomer(nextCustomer);
    setVehicle(firstVehicle?._id || "");
  }

  return <div className="page">
    <div className="page-heading">
      <div>
        <p className="eyebrow">Autel Cloud</p>
        <h1>Autel Import Center</h1>
        <p>Download a scanner report from Autel Cloud, upload it here, and save the VIN, odometer and DTC codes to your customer vehicle history.</p>
      </div>
      <a className="button secondary external-button" href={autelCloudUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open Autel Cloud</a>
    </div>
    <Alert message={error} onClose={() => setError("")} />

    {loading ? <Loading /> : <section className="autel-layout">
      <div className="autel-main">
        <section className="autel-hero">
          <Cloud size={34} />
          <p className="eyebrow">Import workflow</p>
          <h2>Autel uploads the scan. Your web keeps the customer history.</h2>
          <p>Use Autel Cloud to download the PDF report. This page reads the report and lets you attach it to the right customer and vehicle before saving.</p>
          <div className="autel-steps">
            <span><strong>1</strong> Open Autel Cloud</span>
            <span><strong>2</strong> Download PDF</span>
            <span><strong>3</strong> Upload and save</span>
          </div>
        </section>

        <section className="panel">
          <div className="panel-heading"><h2>Upload Autel PDF</h2><p>PDF files up to 8 MB. VIN and odometer are detected automatically when the report includes them.</p></div>
          <div className="autel-upload">
            <label className="autel-dropzone">
              <Upload />
              <strong>{file ? file.name : "Choose Autel scanner PDF"}</strong>
              <span>{file ? `${Math.round(file.size / 1024).toLocaleString()} KB` : "Click here and select the downloaded report"}</span>
              <input type="file" accept="application/pdf" onChange={(event) => parsePdf(event.target.files?.[0] || null)} />
            </label>
            {parsing && <p className="autel-processing">Reading report text...</p>}
          </div>
        </section>

        {preview && <section className="panel">
          <div className="panel-heading"><h2>Preview extracted data</h2><p>Confirm the matched customer and vehicle before saving this scan.</p></div>
          <div className="autel-preview-grid">
            <article><FileScan /><span>Source</span><strong>{preview.sourceFileName}</strong></article>
            <article><CarFront /><span>VIN</span><strong>{preview.vin || "Not found"}</strong></article>
            <article><Gauge /><span>Odometer</span><strong>{Number(preview.mileage || 0).toLocaleString()} mi</strong></article>
            <article><CheckCircle /><span>DTC codes</span><strong>{preview.dtcCodes?.length || 0}</strong></article>
          </div>
          {matchedVehicle && <div className="autel-match"><CheckCircle size={17} /> VIN matched existing vehicle: {matchedVehicle.year} {matchedVehicle.make} {matchedVehicle.model}</div>}
          {preview.dtcCodes?.length ? <div className="scanner-code-table">
            {preview.dtcCodes.map((dtc, index) => <article key={`${dtc.code}-${index}`}>
              <strong>{dtc.code}</strong>
              <span>{dtc.module || "Module -"}</span>
              <p>{dtc.description || "No description captured."}</p>
              <small className={`status ${dtc.status || "active"}`}>{dtc.status || "active"}</small>
            </article>)}
          </div> : <p className="detail-empty">No DTC codes were found in this PDF.</p>}
        </section>}
      </div>

      <aside className="autel-side">
        <section className="panel">
          <div className="panel-heading"><h2>Save to customer</h2><p>Attach the report to the right record.</p></div>
          <div className="autel-save-form">
            <label><UserRound size={15} /> Customer<select value={customer} onChange={(event) => changeCustomer(event.target.value)}><option value="">Select customer</option>{customers.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
            <label><CarFront size={15} /> Vehicle<select value={vehicle} onChange={(event) => setVehicle(event.target.value)} disabled={!customer}><option value="">Select vehicle</option>{customerVehicles.map((item) => <option key={item._id} value={item._id}>{item.year} {item.make} {item.model} {item.plate ? `- ${item.plate}` : ""}</option>)}</select></label>
            <button className="button primary" onClick={saveReport} disabled={saving || !preview || !customer || !vehicle}>{saving ? "Saving..." : "Save scanner report"} <ArrowRight size={16} /></button>
            <Link className="text-button" to="/scanner-reports">View all scanner reports</Link>
          </div>
        </section>
      </aside>
    </section>}
  </div>;
}
