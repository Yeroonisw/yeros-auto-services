import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Estimate from "../models/Estimate.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = search
      ? { $or: ["name", "phone", "email"].map((field) => ({ [field]: { $regex: search, $options: "i" } })) }
      : {};
    res.json(await Customer.find(filter).sort({ createdAt: -1 }));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/history", async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const [vehicles, orders] = await Promise.all([
      Vehicle.find({ customer: customer._id }).sort({ createdAt: -1 }),
      WorkOrder.find({ customer: customer._id })
        .populate("vehicle", "year make model plate vin")
        .sort({ openedAt: -1 }),
    ]);

    res.json({ customer, vehicles, orders });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const [vehicles, orders, estimates] = await Promise.all([
      Vehicle.find({ customer: customer._id }).sort({ createdAt: -1 }),
      WorkOrder.find({ customer: customer._id }).populate("vehicle", "year make model plate vin").sort({ openedAt: -1 }),
      Estimate.find({ customer: customer._id }).populate("vehicle", "year make model plate vin").sort({ createdAt: -1 }),
    ]);
    res.json({ customer, vehicles, orders, estimates });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(await Customer.create(req.body));
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [vehicles, orders, estimates] = await Promise.all([
      Vehicle.countDocuments({ customer: req.params.id }),
      WorkOrder.countDocuments({ customer: req.params.id }),
      Estimate.countDocuments({ customer: req.params.id }),
    ]);
    if (vehicles || orders || estimates) {
      return res.status(409).json({ message: "Delete this customer's vehicles, work orders and estimates first" });
    }
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
