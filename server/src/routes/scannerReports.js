import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import ScannerReport from "../models/ScannerReport.js";
import { extractScannerReportFromPdf, sortDtcCodes } from "../services/scannerPdf.js";

const router = express.Router();
const populate = [
  { path: "customer", select: "name phone email" },
  { path: "vehicle", select: "year make model plate vin customer mileage" },
  { path: "convertedWorkOrder", select: "orderNumber status" },
];
const reportProjection = "-reportFile.data";

function extractReportFile(body) {
  if (!body.reportFileData) return null;
  const match = String(body.reportFileData).match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1];
  if (contentType !== "application/pdf") {
    const error = new Error("Only PDF scanner reports are supported");
    error.status = 400;
    throw error;
  }
  const data = Buffer.from(match[2], "base64");
  if (data.length > 8 * 1024 * 1024) {
    const error = new Error("PDF report must be 8 MB or smaller");
    error.status = 400;
    throw error;
  }
  return {
    fileName: body.reportFileName || body.sourceFileName || "scanner-report.pdf",
    contentType,
    size: data.length,
    data,
  };
}

function cleanBody(body) {
  const { reportFileData, reportFileName, autoFillFromPdf, ...rest } = body;
  if (Array.isArray(rest.dtcCodes)) rest.dtcCodes = sortDtcCodes(rest.dtcCodes);
  return rest;
}

async function applyPdfAutofill(payload, reportFile, enabled) {
  if (!reportFile || !enabled) return;
  try {
    const extracted = await extractScannerReportFromPdf(reportFile.data);
    if (extracted.vin && !payload.vin) payload.vin = extracted.vin;
    if (extracted.mileage && !Number(payload.mileage || 0)) payload.mileage = extracted.mileage;
    if (extracted.dtcCodes.length && !payload.dtcCodes?.length) payload.dtcCodes = extracted.dtcCodes;
    if (extracted.rawText && !payload.rawText) payload.rawText = extracted.rawText;
    if (extracted.summary && !payload.summary) payload.summary = extracted.summary;
  } catch (error) {
    payload.summary = [payload.summary, `PDF uploaded, but automatic text extraction failed: ${error.message}`].filter(Boolean).join("\n");
  }
}

async function validateRelations(customerId, vehicleId) {
  const [customer, vehicle] = await Promise.all([Customer.findById(customerId), Vehicle.findById(vehicleId)]);
  if (!customer || !vehicle) return { error: "Select a valid customer and vehicle" };
  if (String(vehicle.customer) !== String(customer._id)) return { error: "The vehicle does not belong to this customer" };
  return { customer, vehicle };
}

async function syncVehicleFromScan(vehicle, body) {
  let changed = false;
  if (body.vin && body.vin !== vehicle.vin) {
    vehicle.vin = body.vin;
    changed = true;
  }
  if (Number(body.mileage || 0) > Number(vehicle.mileage || 0)) {
    vehicle.mileage = Number(body.mileage);
    changed = true;
  }
  if (changed) await vehicle.save();
}

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.vehicle) filter.vehicle = req.query.vehicle;
    if (req.query.customer) filter.customer = req.query.customer;
    res.json(await ScannerReport.find(filter).select(reportProjection).populate(populate).sort({ scanDate: -1, createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/preview", async (req, res, next) => {
  try {
    const reportFile = extractReportFile(req.body);
    if (!reportFile) return res.status(400).json({ message: "Upload a PDF scanner report" });
    const extracted = await extractScannerReportFromPdf(reportFile.data);
    res.json({
      ...extracted,
      sourceFileName: reportFile.fileName,
      reportFile: {
        fileName: reportFile.fileName,
        contentType: reportFile.contentType,
        size: reportFile.size,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const report = await ScannerReport.findById(req.params.id).select(reportProjection).populate(populate);
    if (!report) return res.status(404).json({ message: "Scanner report not found" });
    res.json(report);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await validateRelations(req.body.customer, req.body.vehicle);
    if (result.error) return res.status(400).json({ message: result.error });
    const payload = cleanBody(req.body);
    const reportFile = extractReportFile(req.body);
    if (reportFile) {
      payload.reportFile = reportFile;
      payload.sourceFileName = reportFile.fileName;
    }
    await applyPdfAutofill(payload, reportFile, req.body.autoFillFromPdf !== false);
    await syncVehicleFromScan(result.vehicle, payload);
    const report = await ScannerReport.create(payload);
    res.status(201).json(await report.populate(populate).then((item) => item.toObject({ virtuals: true, transform: (_, ret) => {
      if (ret.reportFile) delete ret.reportFile.data;
      return ret;
    } })));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/file", async (req, res, next) => {
  try {
    const report = await ScannerReport.findById(req.params.id).select("reportNumber reportFile");
    if (!report) return res.status(404).json({ message: "Scanner report not found" });
    if (!report.reportFile?.data) return res.status(404).json({ message: "No PDF report uploaded" });
    res.setHeader("Content-Type", report.reportFile.contentType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${report.reportFile.fileName || `${report.reportNumber}.pdf`}"`);
    res.send(report.reportFile.data);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const report = await ScannerReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Scanner report not found" });
    const customer = req.body.customer || report.customer;
    const vehicle = req.body.vehicle || report.vehicle;
    const result = await validateRelations(customer, vehicle);
    if (result.error) return res.status(400).json({ message: result.error });
    const payload = cleanBody(req.body);
    const reportFile = extractReportFile(req.body);
    if (reportFile) {
      payload.reportFile = reportFile;
      payload.sourceFileName = reportFile.fileName;
    }
    await applyPdfAutofill(payload, reportFile, req.body.autoFillFromPdf !== false);
    await syncVehicleFromScan(result.vehicle, payload);
    Object.assign(report, payload);
    await report.save();
    const populated = await report.populate(populate);
    const output = populated.toObject({ virtuals: true });
    if (output.reportFile) delete output.reportFile.data;
    res.json(output);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/work-order", async (req, res, next) => {
  try {
    const report = await ScannerReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Scanner report not found" });
    if (report.convertedWorkOrder) return res.status(409).json({ message: "Scanner report already converted" });
    const order = await WorkOrder.create({
      customer: report.customer,
      vehicle: report.vehicle,
      dtcCodes: report.dtcCodes.map(({ code, description, status }) => ({ code, description, status })),
      services: [{ description: "Diagnostic scan", quantity: 1, price: 0, cost: 0 }],
      notes: [report.summary, `Created from scanner report ${report.reportNumber}`].filter(Boolean).join("\n"),
    });
    report.convertedWorkOrder = order._id;
    await report.save();
    res.status(201).json(await order.populate(populate.slice(0, 2)));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const report = await ScannerReport.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ message: "Scanner report not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
