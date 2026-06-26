import express from "express";
import WorkOrder from "../models/WorkOrder.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import { streamDocument } from "../services/pdf.js";

const router = express.Router();
const populate = [
  { path: "customer", select: "name phone email" },
  { path: "vehicle", select: "year make model engine plate vin customer" },
];

async function validateRelations(body) {
  const [customer, vehicle] = await Promise.all([
    Customer.findById(body.customer),
    Vehicle.findById(body.vehicle),
  ]);
  if (!customer || !vehicle) return "Select a valid customer and vehicle";
  if (String(vehicle.customer) !== String(customer._id)) return "The vehicle does not belong to this customer";
  return null;
}

async function syncVehicleFromWorkOrder(order) {
  if (!order?.vehicle) return;
  const vehicle = await Vehicle.findById(order.vehicle);
  if (!vehicle) return;
  let changed = false;
  const oilChange = order.oilChange || {};
  const oilMileage = Number(oilChange.mileage || 0);

  if (oilMileage > Number(vehicle.mileage || 0)) {
    vehicle.mileage = oilMileage;
    changed = true;
  }

  if (oilChange.performed) {
    vehicle.oilChange = {
      lastDate: oilChange.serviceDate || order.completedAt || order.openedAt || new Date(),
      lastMileage: oilMileage || Number(vehicle.mileage || 0),
      intervalMiles: Number(oilChange.intervalMiles || vehicle.oilChange?.intervalMiles || 3000),
      intervalMonths: Number(oilChange.intervalMonths || vehicle.oilChange?.intervalMonths || 3),
      notes: oilChange.notes || vehicle.oilChange?.notes || "",
    };
    changed = true;
  }

  if (changed) await vehicle.save();
}

router.get("/", async (req, res, next) => {
  try {
    const filter = req.query.status ? { status: req.query.status } : {};
    res.json(await WorkOrder.find(filter).populate(populate).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const relationError = await validateRelations(req.body);
    if (relationError) return res.status(400).json({ message: relationError });
    const order = await WorkOrder.create(req.body);
    await syncVehicleFromWorkOrder(order);
    res.status(201).json(await order.populate(populate));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const order = await WorkOrder.findById(req.params.id)
      .populate([
        { path: "customer", select: "name phone email address notes" },
        { path: "vehicle", select: "year make model engine plate vin color mileage customer oilChange" },
        { path: "sourceEstimate", select: "estimateNumber status" },
      ]);
    if (!order) return res.status(404).json({ message: "Work order not found" });
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/invoice", async (req, res, next) => {
  try {
    const order = await WorkOrder.findById(req.params.id).populate(populate);
    if (!order) return res.status(404).json({ message: "Work order not found" });
    streamDocument(res, order, {
      title: "INVOICE",
      number: order.orderNumber,
      date: order.completedAt || order.createdAt,
      status: order.status.replace("_", " ").toUpperCase(),
      filename: `Invoice-${order.orderNumber}.pdf`,
      includeInvoiceDetails: true,
    });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const current = await WorkOrder.findById(req.params.id);
    if (!current) return res.status(404).json({ message: "Work order not found" });
    const relationError = await validateRelations({
      customer: req.body.customer || current.customer,
      vehicle: req.body.vehicle || current.vehicle,
    });
    if (relationError) return res.status(400).json({ message: relationError });

    Object.assign(current, req.body);
    if (current.status === "completed" && !current.completedAt) current.completedAt = new Date();
    if (current.status !== "completed") current.completedAt = undefined;
    await current.save();
    await syncVehicleFromWorkOrder(current);
    res.json(await current.populate(populate));
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const order = await WorkOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Work order not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
