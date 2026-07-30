import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Estimate from "../models/Estimate.js";
import Appointment from "../models/Appointment.js";
import Inspection from "../models/Inspection.js";
import Payment from "../models/Payment.js";

const router = express.Router();

async function requirePortal(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.scope !== "customer") throw new Error("Invalid scope");
    const customer = await Customer.findById(payload.customerId);
    if (!customer?.portalEnabled) return res.status(401).json({ message: "Portal access is disabled" });
    req.customer = customer;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired customer session" });
  }
}

router.post("/login", async (req, res, next) => {
  try {
    const phone = String(req.body.phone || "").replace(/\D/g, "");
    const code = String(req.body.code || "");
    const customers = await Customer.find({ portalEnabled: true }).select("+portalCodeHash");
    const customer = customers.find((item) => String(item.phone || "").replace(/\D/g, "") === phone);
    if (!customer || !(await bcrypt.compare(code, customer.portalCodeHash || ""))) return res.status(401).json({ message: "Invalid phone number or access code" });
    customer.portalLastLoginAt = new Date(); await customer.save();
    const token = jwt.sign({ customerId: customer.id, scope: "customer" }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, customer: { id: customer.id, name: customer.name } });
  } catch (error) { next(error); }
});

router.get("/account", requirePortal, async (req, res, next) => {
  try {
    const customer = req.customer;
    const [vehicles, orders, estimates, appointments, inspections, payments] = await Promise.all([
      Vehicle.find({ customer: customer._id }).select("year make model vin plate mileage oilChange"),
      WorkOrder.find({ customer: customer._id }).populate("vehicle", "year make model").select("orderNumber vehicle status services openedAt completedAt paymentStatus"),
      Estimate.find({ customer: customer._id }).populate("vehicle", "year make model").sort({ createdAt: -1 }),
      Appointment.find({ customer: customer._id }).populate("vehicle", "year make model").sort({ scheduledAt: -1 }),
      Inspection.find({ customer: customer._id }).populate("vehicle", "year make model").select("-publicToken").sort({ createdAt: -1 }),
      Payment.find({ customer: customer._id }).populate("workOrder", "orderNumber").sort({ createdAt: -1 }),
    ]);
    res.json({ customer: { name: customer.name, phone: customer.phone, email: customer.email, address: customer.address }, vehicles, orders, estimates, appointments, inspections, payments });
  } catch (error) { next(error); }
});

router.post("/estimates/:id/decision", requirePortal, async (req, res, next) => {
  try {
    if (!["approved", "declined"].includes(req.body.decision)) return res.status(400).json({ message: "Choose approve or decline" });
    const estimate = await Estimate.findOne({ _id: req.params.id, customer: req.customer._id });
    if (!estimate || estimate.status === "converted") return res.status(404).json({ message: "Estimate is not available" });
    estimate.status = req.body.decision;
    estimate.customerSignature = String(req.body.signature || "").trim();
    estimate.customerDecisionAt = new Date();
    await estimate.save();
    res.json({ status: estimate.status, message: `Estimate ${estimate.status}` });
  } catch (error) { next(error); }
});

export default router;
