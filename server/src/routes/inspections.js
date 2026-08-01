import express from "express";
import Inspection from "../models/Inspection.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();
const populate = [
  { path: "customer", select: "name phone email" },
  { path: "vehicle", select: "year make model vin plate mileage" },
  { path: "workOrder", select: "orderNumber status" },
  { path: "technician", select: "name" },
];
const checklist = [
  ["Safety", "Front brakes"], ["Safety", "Rear brakes"], ["Safety", "Tires and tread"],
  ["Under hood", "Engine oil"], ["Under hood", "Coolant"], ["Under hood", "Battery"],
  ["Under vehicle", "Leaks"], ["Under vehicle", "Suspension"], ["Visibility", "Lights"],
  ["Visibility", "Wipers"], ["Road test", "Steering and handling"], ["Road test", "Warning lights"],
].map(([category, label]) => ({ category, label, condition: "not_checked" }));

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await Inspection.find(filter).populate(populate).sort({ createdAt: -1 }).limit(100));
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  try {
    const [customer, vehicle] = await Promise.all([Customer.findById(req.body.customer), Vehicle.findById(req.body.vehicle)]);
    if (!customer || !vehicle || String(vehicle.customer) !== String(customer._id)) return res.status(400).json({ message: "Select a valid customer and vehicle" });
    const inspection = await Inspection.create({ ...req.body, technician: req.body.technician || req.user._id, items: req.body.items?.length ? req.body.items : checklist });
    await recordAudit(req, "create", "Inspection", inspection, `Created inspection ${inspection.inspectionNumber}`);
    res.status(201).json(await inspection.populate(populate));
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id).populate(populate);
    if (!inspection) return res.status(404).json({ message: "Inspection not found" });
    res.json(inspection);
  } catch (error) { next(error); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) return res.status(404).json({ message: "Inspection not found" });
    Object.assign(inspection, req.body);
    await inspection.save();
    await recordAudit(req, "update", "Inspection", inspection, `Updated inspection ${inspection.inspectionNumber}`);
    res.json(await inspection.populate(populate));
  } catch (error) { next(error); }
});

router.post("/:id/send", async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id).populate(populate);
    if (!inspection) return res.status(404).json({ message: "Inspection not found" });
    inspection.status = "sent"; inspection.sentAt = new Date(); await inspection.save();
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const url = `${base}/inspection/${inspection.publicToken}`;
    const message = `Hello ${inspection.customer.name}, your digital vehicle inspection from Yeros Auto Services is ready: ${url}`;
    const phone = String(inspection.customer.phone || "").replace(/\D/g, "");
    res.json({ inspection, publicUrl: url, whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "" });
  } catch (error) { next(error); }
});

router.post("/:id/convert", async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) return res.status(404).json({ message: "Inspection not found" });
    if (inspection.convertedWorkOrder) return res.status(409).json({ message: "This inspection was already converted" });
    const recommendations = inspection.recommendedServices.length ? inspection.recommendedServices : inspection.items.filter((item) => ["attention", "urgent"].includes(item.condition)).map((item) => `${item.label}${item.notes ? ` - ${item.notes}` : ""}`);
    if (!recommendations.length) return res.status(400).json({ message: "Add a recommendation or mark an item attention/urgent first" });
    const order = await WorkOrder.create({ customer: inspection.customer, vehicle: inspection.vehicle, sourceInspection: inspection._id, workflowStage: "waiting_approval", services: recommendations.map((description) => ({ description, quantity: 1, price: 0, cost: 0 })), notes: `Created from inspection ${inspection.inspectionNumber}` });
    inspection.convertedWorkOrder = order._id; await inspection.save();
    await recordAudit(req, "convert", "Inspection", inspection, `Converted ${inspection.inspectionNumber} to ${order.orderNumber}`);
    res.status(201).json(order);
  } catch (error) { next(error); }
});

export default router;
