import { useEffect, useMemo, useState } from "react";
import { Activity, CarFront, ClipboardPlus, Download, FileScan, Plus, Trash2, Upload } from "lucide-react";
import api, { errorMessage } from "../api.js";
import Modal from "../components/Modal.jsx";
import { Alert, Empty, Loading } from "../components/PageState.jsx";

const blank = {
  customer: "",
  vehicle: "",
  scannerModel: "Autel MK900",
  scanDate: new Date().toISOString().slice(0, 10),
  vin: "",
  mileage: 0,
  dtcCodes: [{ code: "", description: "", status: "active", module: "" }],
  summary: "",
  rawText: "",
  sourceFileName: "",
};

export default function ScannerReports() {
  const [reports, setReports] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [reportFile, setReportFile] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [{ data: reportData }, { data: customerData }, { data: vehicleData }] = await Promise.all([
        api.get("/scanner-reports"),
        api.get("/customers"),
        api.get("/vehicles"),
      ]);
      setReports(reportData);
      setCustomers(customerData);
      setVehicles(vehicleData);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const customerVehicles = useMemo(() => vehicles.filter((vehicle) => (vehicle.customer?._id || vehicle.customer) === form.customer), [vehicles, form.customer]);
  const stats = useMemo(() => ({
    total: reports.length,
    codes: reports.reduce((sum, report) => sum + (report.dtcCodes?.length || 0), 0),
    converted: reports.filter((report) => report.convertedWorkOrder).length,
  }), [reports]);

  function open(report = null) {
    setEditing(report);
    setReportFile(null);
    if (report) {
      setForm({
        customer: report.customer?._id || "",
        vehicle: report.vehicle?._id || "",
        scannerModel: report.scannerModel || "Autel MK900",
        scanDate: report.scanDate ? report.scanDate.slice(0, 10) : new Date().toISOString().slice(0, 10),
        vin: report.vin || report.vehicle?.vin || "",
        mileage: report.mileage || report.vehicle?.mileage || 0,
        dtcCodes: report.dtcCodes?.length ? report.dtcCodes.map(({ code, description, status, module }) => ({ code, description, status, module: module || "" })) : [{ code: "", description: "", status: "active", module: "" }],
        summary: report.summary || "",
        rawText: report.rawText || "",
        sourceFileName: report.sourceFileName || "",
      });
    } else {
      const customer = customers[0]?._id || "";
      const vehicle = vehicles.find((item) => (item.customer?._id || item.customer) === customer);
      setForm({ ...blank, customer, vehicle: vehicle?._id || "", vin: vehicle?.vin || "", mileage: vehicle?.mileage || 0, dtcCodes: [{ code: "", description: "", status: "active", module: "" }] });
    }
    setModalOpen(true);
  }

  function updateCustomer(customer) {
    const vehicle = vehicles.find((item) => (item.customer?._id || item.customer) === customer);
    setForm({ ...form, customer, vehicle: vehicle?._id || "", vin: vehicle?.vin || "", mileage: vehicle?.mileage || 0 });
  }

  function updateVehicle(vehicleId) {
    const vehicle = vehicles.find((item) => item._id === vehicleId);
    setForm({ ...form, vehicle: vehicleId, vin: vehicle?.vin || form.vin, mileage: vehicle?.mileage || form.mileage });
  }

  function updateDtc(index, field, value) {
    setForm({ ...form, dtcCodes: form.dtcCodes.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let reportFileData = "";
      if (reportFile) {
        if (reportFile.type !== "application/pdf") throw new Error("Only PDF scanner reports are supported");
        if (reportFile.size > 8 * 1024 * 1024) throw new Error("PDF report must be 8 MB or smaller");
        reportFileData = await readFileAsDataUrl(reportFile);
      }
      const payload = {
        ...form,
        scanDate: form.scanDate || null,
        dtcCodes: form.dtcCodes.filter((item) => item.code.trim()),
        ...(reportFileData ? { reportFileData, reportFileName: reportFile.name, autoFillFromPdf: true } : {}),
      };
      if (editing) await api.put(`/scanner-reports/${editing._id}`, payload);
      else await api.post("/scanner-reports", payload);
      setModalOpen(false);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function createWorkOrder(report) {
    try {
      await api.post(`/scanner-reports/${report._id}/work-order`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  async function downloadReport(report) {
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

  async function remove(report) {
    if (!window.confirm(`Delete scanner report ${report.reportNumber}?`)) return;
    try {
      await api.delete(`/scanner-reports/${report._id}`);
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  }

  return <div className="page">
    <div className="page-heading">
      <div><p className="eyebrow">Autel MK900</p><h1>Scanner Reports</h1><p>Register scan reports, VIN, mileage and DTC history for every vehicle.</p></div>
      <button className="button primary" onClick={() => open()} disabled={!customers.length || !vehicles.length}><Plus size={16} /> New scan</button>
    </div>
    {(!customers.length || !vehicles.length) && !loading && <Alert message="Add a customer and vehicle before recording scanner reports." onClose={() => {}} />}
    <Alert message={error} onClose={() => setError("")} />

    <section className="scanner-hero">
      <div><Activity size={32} /><p className="eyebrow">Diagnostic history</p><h2>Keep every Autel scan tied to the vehicle.</h2><p>For now, enter the report manually from the MK900. Later we can import PDF reports when you share a real Autel sample.</p></div>
      <div className="scanner-stats">
        <article><span>Reports</span><strong>{stats.total}</strong></article>
        <article><span>DTC codes</span><strong>{stats.codes}</strong></article>
        <article><span>Work orders</span><strong>{stats.converted}</strong></article>
      </div>
    </section>

    {loading ? <Loading /> : reports.length ? <section className="scanner-grid">
      {reports.map((report) => <article className="scanner-card" key={report._id}>
        <header>
          <div><span>{report.scannerModel}</span><strong>{report.reportNumber}</strong><small>{new Date(report.scanDate).toLocaleDateString()}</small></div>
          <FileScan />
        </header>
        <div className="scanner-car"><CarFront size={17} /><span>{report.vehicle?.year} {report.vehicle?.make} {report.vehicle?.model}</span><small>{report.customer?.name}</small></div>
        <div className="scanner-vitals"><span>VIN <strong>{report.vin || report.vehicle?.vin || "-"}</strong></span><span>Mileage <strong>{Number(report.mileage || report.vehicle?.mileage || 0).toLocaleString()} mi</strong></span></div>
        {report.dtcCodes?.length ? <div className="scanner-dtc-list">{report.dtcCodes.map((dtc, index) => <span key={`${dtc.code}-${index}`}>{dtc.code}</span>)}</div> : <p className="detail-empty compact-empty">No DTC codes.</p>}
        {report.reportFile?.fileName && <small className="scanner-file"><Upload size={13} /> {report.reportFile.fileName}</small>}
        {report.summary && <p className="scanner-summary">{report.summary}</p>}
        <div className="scanner-actions">
          <button className="text-button" onClick={() => open(report)}>Edit</button>
          {report.reportFile?.fileName && <button className="text-button" onClick={() => downloadReport(report)}><Download size={14} /> PDF</button>}
          <button className="text-button" onClick={() => createWorkOrder(report)} disabled={Boolean(report.convertedWorkOrder)}><ClipboardPlus size={14} /> {report.convertedWorkOrder ? report.convertedWorkOrder.orderNumber : "Create WO"}</button>
          <button className="text-button danger" onClick={() => remove(report)}><Trash2 size={14} /> Delete</button>
        </div>
      </article>)}
    </section> : <Empty>No scanner reports yet. Add the first Autel scan after diagnosing a vehicle.</Empty>}

    {modalOpen && <Modal title={editing ? `Edit ${editing.reportNumber}` : "New scanner report"} onClose={() => setModalOpen(false)} wide>
      <form className="form-grid" onSubmit={submit}>
        <label>Customer<select value={form.customer} onChange={(event) => updateCustomer(event.target.value)} required><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}</select></label>
        <label>Vehicle<select value={form.vehicle} onChange={(event) => updateVehicle(event.target.value)} required><option value="">Select vehicle</option>{customerVehicles.map((vehicle) => <option key={vehicle._id} value={vehicle._id}>{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.plate ? `- ${vehicle.plate}` : ""}</option>)}</select></label>
        <label>Scanner model<input value={form.scannerModel} onChange={(event) => setForm({ ...form, scannerModel: event.target.value })} /></label>
        <label>Scan date<input type="date" value={form.scanDate} onChange={(event) => setForm({ ...form, scanDate: event.target.value })} /></label>
        <label>VIN<input value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value.toUpperCase() })} /></label>
        <label>Mileage<input type="number" min="0" value={form.mileage} onChange={(event) => setForm({ ...form, mileage: Number(event.target.value) })} /></label>
        <label className="span-2">Upload PDF report and auto-fill<input type="file" accept="application/pdf" onChange={(event) => {
          const file = event.target.files?.[0] || null;
          setReportFile(file);
          if (file) setForm({ ...form, sourceFileName: file.name });
        }} /></label>
        <label className="span-2">Source file name<input value={form.sourceFileName} onChange={(event) => setForm({ ...form, sourceFileName: event.target.value })} placeholder="Example: Autel_Report_2026-06-16.pdf" /></label>
        <div className="span-2 service-editor">
          <div className="service-heading"><strong>DTC codes from scan</strong><button type="button" className="text-button" onClick={() => setForm({ ...form, dtcCodes: [...form.dtcCodes, { code: "", description: "", status: "active", module: "" }] })}>+ Add DTC</button></div>
          {form.dtcCodes.map((item, index) => <div className="scanner-dtc-row" key={index}>
            <input aria-label="DTC code" placeholder="P0300" value={item.code} onChange={(event) => updateDtc(index, "code", event.target.value.toUpperCase())} />
            <input aria-label="Module" placeholder="ECM / TCM / ABS" value={item.module} onChange={(event) => updateDtc(index, "module", event.target.value)} />
            <input aria-label="Description" placeholder="Description" value={item.description} onChange={(event) => updateDtc(index, "description", event.target.value)} />
            <select aria-label="Status" value={item.status} onChange={(event) => updateDtc(index, "status", event.target.value)}><option value="active">Active</option><option value="pending">Pending</option><option value="history">History</option></select>
            <button type="button" className="remove-line" onClick={() => setForm({ ...form, dtcCodes: form.dtcCodes.filter((_, i) => i !== index) })} disabled={form.dtcCodes.length === 1}>x</button>
          </div>)}
        </div>
        <label className="span-2">Summary<textarea rows="3" value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} placeholder="Short diagnostic summary..." /></label>
        <label className="span-2">Raw report text<textarea rows="5" value={form.rawText} onChange={(event) => setForm({ ...form, rawText: event.target.value })} placeholder="Paste text copied from the Autel report here if available." /></label>
        <div className="form-actions span-2"><button type="button" className="button secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="button primary" disabled={saving}>{saving ? "Saving..." : "Save scan"}</button></div>
      </form>
    </Modal>}
  </div>;
}
