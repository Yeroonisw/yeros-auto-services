import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import ScannerReport from "../models/ScannerReport.js";

const router = express.Router();
const populate = [
  { path: "customer", select: "name phone email" },
  { path: "vehicle", select: "year make model plate vin customer mileage" },
  { path: "convertedWorkOrder", select: "orderNumber status" },
];

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
    res.json(await ScannerReport.find(filter).populate(populate).sort({ scanDate: -1, createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const result = await validateRelations(req.body.customer, req.body.vehicle);
    if (result.error) return res.status(400).json({ message: result.error });
    await syncVehicleFromScan(result.vehicle, req.body);
    const report = await ScannerReport.create(req.body);
    res.status(201).json(await report.populate(populate));
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
    await syncVehicleFromScan(result.vehicle, req.body);
    Object.assign(report, req.body);
    await report.save();
    res.json(await report.populate(populate));
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
