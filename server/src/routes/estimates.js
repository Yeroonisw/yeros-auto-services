import express from "express";
import Estimate from "../models/Estimate.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import { streamDocument } from "../services/pdf.js";

const router = express.Router();
const populate = [
  { path: "customer", select: "name phone email address" },
  { path: "vehicle", select: "year make model plate vin customer" },
  { path: "convertedWorkOrder", select: "orderNumber" },
];

async function validRelations(customerId, vehicleId) {
  const [customer, vehicle] = await Promise.all([Customer.findById(customerId), Vehicle.findById(vehicleId)]);
  return Boolean(customer && vehicle && String(vehicle.customer) === String(customer._id));
}

router.get("/", async (req, res, next) => {
  try {
    res.json(await Estimate.find().populate(populate).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!(await validRelations(req.body.customer, req.body.vehicle))) {
      return res.status(400).json({ message: "Select a valid customer and vehicle" });
    }
    const estimate = await Estimate.create(req.body);
    res.status(201).json(await estimate.populate(populate));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });
    if (estimate.status === "converted") return res.status(409).json({ message: "Converted estimates cannot be edited" });
    const customer = req.body.customer || estimate.customer;
    const vehicle = req.body.vehicle || estimate.vehicle;
    if (!(await validRelations(customer, vehicle))) {
      return res.status(400).json({ message: "Select a valid customer and vehicle" });
    }
    Object.assign(estimate, req.body);
    await estimate.save();
    res.json(await estimate.populate(populate));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/convert", async (req, res, next) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });
    if (estimate.convertedWorkOrder) return res.status(409).json({ message: "Estimate already converted" });
    const services = Array.isArray(estimate.services)
      ? estimate.services.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity || 0),
        price: Number(item.price || 0),
        cost: 0,
      }))
      : [];
    const order = await WorkOrder.create({
      customer: estimate.customer,
      vehicle: estimate.vehicle,
      services,
      labor: Number(estimate.labor || 0),
      taxRate: Number(estimate.taxRate || 0),
      notes: estimate.notes,
      sourceEstimate: estimate._id,
    });
    estimate.status = "converted";
    estimate.convertedWorkOrder = order._id;
    await estimate.save();
    res.status(201).json(await order.populate(populate.slice(0, 2)));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/pdf", async (req, res, next) => {
  try {
    const estimate = await Estimate.findById(req.params.id).populate(populate);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });
    streamDocument(res, estimate, {
      title: "ESTIMATE",
      number: estimate.estimateNumber,
      date: estimate.createdAt,
      status: estimate.status.toUpperCase(),
      filename: `${estimate.estimateNumber}.pdf`,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const estimate = await Estimate.findById(req.params.id);
    if (!estimate) return res.status(404).json({ message: "Estimate not found" });
    if (estimate.status === "converted") return res.status(409).json({ message: "Converted estimates cannot be deleted" });
    await estimate.deleteOne();
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
