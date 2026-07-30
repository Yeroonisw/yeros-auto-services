import express from "express";
import Reminder from "../models/Reminder.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import Appointment from "../models/Appointment.js";
import Estimate from "../models/Estimate.js";
import WorkOrder from "../models/WorkOrder.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();
const customerFields = "name phone email";

function whatsappLink(phone, message) {
  const normalized = String(phone || "").replace(/\D/g, "");
  return normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}` : "";
}

async function generatedReminders() {
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const [vehicles, appointments, estimates, unpaidOrders, followUps] = await Promise.all([
    Vehicle.find().populate("customer", customerFields),
    Appointment.find({ scheduledAt: { $gte: now, $lte: inThreeDays }, status: { $in: ["scheduled", "confirmed"] } }).populate("customer", customerFields).populate("vehicle", "year make model"),
    Estimate.find({ status: { $in: ["draft", "sent"] }, createdAt: { $lte: sevenDaysAgo } }).populate("customer", customerFields).populate("vehicle", "year make model"),
    WorkOrder.find({ status: "completed", paymentMethod: { $in: ["Pending", "pending", ""] } }).populate("customer", customerFields).populate("vehicle", "year make model"),
    WorkOrder.find({ status: "completed", completedAt: { $lte: sevenDaysAgo } }).populate("customer", customerFields).populate("vehicle", "year make model").sort({ completedAt: -1 }).limit(30),
  ]);

  const items = [];
  for (const vehicle of vehicles) {
    if (!["overdue", "due_soon"].includes(vehicle.oilChangeStatus?.status) || !vehicle.customer) continue;
    const message = `Hello ${vehicle.customer.name}, your ${vehicle.year} ${vehicle.make} ${vehicle.model} is ${vehicle.oilChangeStatus.status === "overdue" ? "due" : "coming due"} for an oil change. Reply here to schedule with Yeros Auto Services.`;
    items.push({ id: `oil-${vehicle._id}`, type: "oil_change", title: "Oil change", customer: vehicle.customer, vehicle, dueAt: vehicle.oilChangeStatus.nextDate || now, message, whatsappUrl: whatsappLink(vehicle.customer.phone, message), source: "automatic" });
  }
  for (const item of appointments) {
    const message = `Hello ${item.customer.name}, this is a reminder for your appointment with Yeros Auto Services on ${item.scheduledAt.toLocaleString("en-US")}. Please reply to confirm.`;
    items.push({ id: `appointment-${item._id}`, type: "appointment", title: "Upcoming appointment", customer: item.customer, vehicle: item.vehicle, dueAt: item.scheduledAt, message, whatsappUrl: whatsappLink(item.customer.phone, message), source: "automatic" });
  }
  for (const item of estimates) {
    const message = `Hello ${item.customer.name}, we are following up on estimate ${item.estimateNumber}. Let us know if you have questions or would like to schedule the repair.`;
    items.push({ id: `estimate-${item._id}`, type: "estimate", title: "Estimate awaiting approval", customer: item.customer, vehicle: item.vehicle, dueAt: item.createdAt, message, whatsappUrl: whatsappLink(item.customer.phone, message), source: "automatic" });
  }
  for (const item of unpaidOrders) {
    const message = `Hello ${item.customer.name}, invoice ${item.orderNumber} from Yeros Auto Services is still marked pending. Please contact us if payment has already been sent.`;
    items.push({ id: `invoice-${item._id}`, type: "invoice", title: "Invoice pending", customer: item.customer, vehicle: item.vehicle, dueAt: item.completedAt, message, whatsappUrl: whatsappLink(item.customer.phone, message), source: "automatic" });
  }
  const seenCustomers = new Set();
  for (const item of followUps) {
    const customerId = String(item.customer?._id || "");
    if (!customerId || seenCustomers.has(customerId)) continue;
    seenCustomers.add(customerId);
    const message = `Hello ${item.customer.name}, Yeros Auto Services is checking in after repair ${item.orderNumber}. Is everything running well?`;
    items.push({ id: `followup-${item._id}`, type: "repair_follow_up", title: "Post-repair follow-up", customer: item.customer, vehicle: item.vehicle, dueAt: new Date(item.completedAt.getTime() + 7 * 86400000), message, whatsappUrl: whatsappLink(item.customer.phone, message), source: "automatic" });
  }
  return items;
}

router.get("/", async (req, res, next) => {
  try {
    const [automatic, manual] = await Promise.all([
      generatedReminders(),
      Reminder.find({ status: req.query.status || "pending" }).populate("customer", customerFields).populate("vehicle", "year make model").sort({ dueAt: 1 }),
    ]);
    const custom = manual.map((item) => {
      const json = item.toJSON();
      return { ...json, id: item.id, source: "manual", whatsappUrl: whatsappLink(item.customer?.phone, item.message) };
    });
    res.json({ items: [...automatic, ...custom].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)), counts: {
      oil: automatic.filter((item) => item.type === "oil_change").length,
      appointments: automatic.filter((item) => item.type === "appointment").length,
      estimates: automatic.filter((item) => item.type === "estimate").length,
      invoices: automatic.filter((item) => item.type === "invoice").length,
      followUps: automatic.filter((item) => item.type === "repair_follow_up").length,
      custom: custom.length,
    } });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    if (!(await Customer.exists({ _id: req.body.customer }))) return res.status(400).json({ message: "Select a valid customer" });
    const reminder = await Reminder.create({ ...req.body, createdBy: req.user._id });
    await recordAudit(req, "create", "Reminder", reminder, `Created reminder: ${reminder.title}`);
    res.status(201).json(await reminder.populate("customer", customerFields));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/sent", async (req, res, next) => {
  try {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, { status: "sent", sentAt: new Date(), channel: req.body.channel || "whatsapp" }, { new: true });
    if (!reminder) return res.status(404).json({ message: "Reminder not found" });
    await recordAudit(req, "send", "Reminder", reminder, `Marked reminder as sent`);
    res.json(reminder);
  } catch (error) {
    next(error);
  }
});

export default router;
