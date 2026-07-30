import express from "express";
import Vehicle from "../models/Vehicle.js";
import Customer from "../models/Customer.js";
import WorkOrder from "../models/WorkOrder.js";
import Estimate from "../models/Estimate.js";
import ScannerReport from "../models/ScannerReport.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.customer ? { customer: req.query.customer } : {};
    res.json(await Vehicle.find(filter).populate("customer", "name phone").sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate("customer", "name phone email address");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    const [orders, estimates, scannerReports] = await Promise.all([
      WorkOrder.find({ vehicle: vehicle._id }).populate("customer", "name phone").sort({ openedAt: -1 }),
      Estimate.find({ vehicle: vehicle._id }).populate("customer", "name phone").sort({ createdAt: -1 }),
      ScannerReport.find({ vehicle: vehicle._id }).select("-reportFile.data").populate("customer", "name phone").sort({ scanDate: -1 }),
    ]);
    const serviceFrequency = new Map();
    const mileageHistory = [...(vehicle.mileageHistory || []), ...(vehicle.oilChangeHistory || []).map((entry) => ({
      mileage: entry.mileage,
      recordedAt: entry.serviceDate,
      source: entry.orderNumber || "Oil change",
    }))].filter((entry) => entry.mileage).sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    for (const order of orders) {
      for (const service of order.services || []) {
        const name = service.description?.trim();
        if (name) serviceFrequency.set(name, (serviceFrequency.get(name) || 0) + 1);
      }
    }
    res.json({
      vehicle,
      orders,
      estimates,
      scannerReports,
      insights: {
        mileageHistory,
        recurringRepairs: [...serviceFrequency.entries()].filter(([, count]) => count > 1).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        dtcHistory: scannerReports.flatMap((report) => (report.dtcCodes || []).map((dtc) => ({ ...(dtc.toObject?.() || dtc), scanDate: report.scanDate, reportNumber: report.reportNumber }))),
        nextMaintenance: vehicle.oilChangeStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/attachments", async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    if (!req.body.name || !req.body.url) return res.status(400).json({ message: "File name and content are required" });
    vehicle.attachments.push({ name: req.body.name, kind: req.body.kind || "document", url: req.body.url });
    await vehicle.save();
    await recordAudit(req, "attachment_add", "Vehicle", vehicle, `Added ${req.body.name} to vehicle files`);
    res.status(201).json(vehicle.attachments.at(-1));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!(await Customer.exists({ _id: req.body.customer }))) {
      return res.status(400).json({ message: "Select a valid customer" });
    }
    const vehicle = await Vehicle.create(req.body);
    if (vehicle.mileage) vehicle.mileageHistory = [{ mileage: vehicle.mileage, recordedAt: new Date(), source: "Vehicle created" }];
    await vehicle.save();
    await recordAudit(req, "create", "Vehicle", vehicle, `Created ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    res.status(201).json(await vehicle.populate("customer", "name phone"));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    if (req.body.customer && !(await Customer.exists({ _id: req.body.customer }))) {
      return res.status(400).json({ message: "Select a valid customer" });
    }
    const current = await Vehicle.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Vehicle not found" });
    const nextMileage = Number(req.body.mileage);
    if (Number.isFinite(nextMileage) && nextMileage !== Number(current.mileage || 0)) {
      current.mileageHistory.push({ mileage: nextMileage, recordedAt: new Date(), source: "Manual update" });
    }
    Object.assign(current, req.body);
    await current.save();
    const vehicle = await current.populate("customer", "name phone");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    await recordAudit(req, "update", "Vehicle", vehicle, `Updated ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [order, estimate, scannerReport] = await Promise.all([
      WorkOrder.exists({ vehicle: req.params.id }),
      Estimate.exists({ vehicle: req.params.id }),
      ScannerReport.exists({ vehicle: req.params.id }),
    ]);
    if (order || estimate || scannerReport) {
      return res.status(409).json({ message: "Delete this vehicle's work orders, estimates and scanner reports first" });
    }
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
