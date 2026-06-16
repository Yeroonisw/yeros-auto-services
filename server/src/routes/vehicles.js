import express from "express";
import Vehicle from "../models/Vehicle.js";
import Customer from "../models/Customer.js";
import WorkOrder from "../models/WorkOrder.js";
import Estimate from "../models/Estimate.js";
import ScannerReport from "../models/ScannerReport.js";

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
      ScannerReport.find({ vehicle: vehicle._id }).populate("customer", "name phone").sort({ scanDate: -1 }),
    ]);
    res.json({ vehicle, orders, estimates, scannerReports });
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
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("customer", "name phone");
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
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
