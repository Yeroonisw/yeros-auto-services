import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Estimate from "../models/Estimate.js";
import CustomerInteraction from "../models/CustomerInteraction.js";
import { recordAudit } from "../services/audit.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

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

router.get("/:id/interactions", async (req, res, next) => {
  try {
    res.json(await CustomerInteraction.find({ customer: req.params.id }).populate("createdBy", "name").sort({ occurredAt: -1 }).limit(100));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/interactions", async (req, res, next) => {
  try {
    if (!(await Customer.exists({ _id: req.params.id }))) return res.status(404).json({ message: "Customer not found" });
    const interaction = await CustomerInteraction.create({ ...req.body, customer: req.params.id, createdBy: req.user._id });
    await recordAudit(req, "create", "CustomerInteraction", interaction, `Logged ${interaction.type} with customer`);
    res.status(201).json(await interaction.populate("createdBy", "name"));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/portal-access", async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id).select("+portalCodeHash");
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const code = String(crypto.randomInt(100000, 1000000));
    customer.portalCodeHash = await bcrypt.hash(code, 12);
    customer.portalEnabled = true;
    await customer.save();
    await recordAudit(req, "portal_enable", "Customer", customer, `Enabled customer portal for ${customer.name}`);
    const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
    const message = `Hello ${customer.name}, your Yeros Auto Services customer portal is ready. Visit ${base}/portal and use phone ${customer.phone} with access code ${code}.`;
    const phone = String(customer.phone || "").replace(/\D/g, "");
    res.json({ code, portalUrl: `${base}/portal`, whatsappUrl: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "" });
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    const [vehicles, orders, estimates, interactions] = await Promise.all([
      Vehicle.find({ customer: customer._id }).sort({ createdAt: -1 }),
      WorkOrder.find({ customer: customer._id }).populate("vehicle", "year make model plate vin").sort({ openedAt: -1 }),
      Estimate.find({ customer: customer._id }).populate("vehicle", "year make model plate vin").sort({ createdAt: -1 }),
      CustomerInteraction.find({ customer: customer._id }).populate("createdBy", "name").sort({ occurredAt: -1 }).limit(30),
    ]);
    const completed = orders.filter((order) => order.status === "completed");
    const totalSpent = completed.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const lastOrder = completed[0] || orders[0] || null;
    const nextMaintenance = vehicles
      .map((vehicle) => ({ vehicle, status: vehicle.oilChangeStatus }))
      .filter((item) => item.status?.nextDate || item.status?.nextMileage)
      .sort((a, b) => Number(a.status.daysRemaining ?? 999999) - Number(b.status.daysRemaining ?? 999999))[0] || null;
    res.json({
      customer,
      vehicles,
      orders,
      estimates,
      interactions,
      insights: {
        visits: completed.length,
        totalSpent,
        averageTicket: completed.length ? totalSpent / completed.length : 0,
        lastService: lastOrder ? { orderNumber: lastOrder.orderNumber, date: lastOrder.completedAt || lastOrder.openedAt, services: lastOrder.services, vehicle: lastOrder.vehicle } : null,
        nextMaintenance,
        customerType: completed.length > 1 ? "recurring" : completed.length === 1 ? "one_time" : "new",
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    await recordAudit(req, "create", "Customer", customer, `Created customer ${customer.name}`);
    res.status(201).json(customer);
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
    await recordAudit(req, "update", "Customer", customer, `Updated customer ${customer.name}`);
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
