import express from "express";
import User from "../models/User.js";
import WorkOrder from "../models/WorkOrder.js";
import TimeEntry from "../models/TimeEntry.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [users, entries, orders] = await Promise.all([
      User.find({ active: true }).sort({ name: 1 }),
      TimeEntry.find().populate("technician", "name hourlyRate").populate("workOrder", "orderNumber").sort({ clockIn: -1 }).limit(200),
      WorkOrder.find({ assignedTechnician: { $ne: null } }).populate("assignedTechnician", "name").select("assignedTechnician status grossProfit completedAt"),
    ]);
    const performance = users.map((user) => {
      const userEntries = entries.filter((entry) => String(entry.technician?._id) === String(user._id));
      const userOrders = orders.filter((order) => String(order.assignedTechnician?._id) === String(user._id));
      const minutes = userEntries.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
      const profit = userOrders.filter((order) => order.status === "completed").reduce((sum, order) => sum + Number(order.grossProfit || 0), 0);
      return { user, minutes, laborCost: minutes / 60 * Number(user.hourlyRate || 0), assigned: userOrders.filter((order) => order.status !== "completed").length, completed: userOrders.filter((order) => order.status === "completed").length, profit };
    });
    res.json({ users, entries, performance });
  } catch (error) { next(error); }
});

router.post("/assign", async (req, res, next) => {
  try {
    const [user, order] = await Promise.all([User.findById(req.body.technician), WorkOrder.findById(req.body.workOrder)]);
    if (!user || !order) return res.status(404).json({ message: "Technician or work order not found" });
    order.assignedTechnician = user._id; await order.save();
    await recordAudit(req, "assign", "WorkOrder", order, `Assigned ${order.orderNumber} to ${user.name}`);
    res.json(order);
  } catch (error) { next(error); }
});

router.put("/users/:id/compensation", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator permission required" });
    const user = await User.findByIdAndUpdate(req.params.id, {
      hourlyRate: Number(req.body.hourlyRate || 0),
      commissionRate: Number(req.body.commissionRate || 0),
    }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "Technician not found" });
    await recordAudit(req, "compensation_update", "User", user, `Updated compensation for ${user.name}`);
    res.json(user);
  } catch (error) { next(error); }
});

router.post("/clock-in", async (req, res, next) => {
  try {
    const technician = req.body.technician || req.user._id;
    if (await TimeEntry.exists({ technician, clockOut: null })) return res.status(409).json({ message: "This technician already has an active timer" });
    const user = await User.findById(technician);
    const entry = await TimeEntry.create({ technician, workOrder: req.body.workOrder, hourlyRate: user?.hourlyRate || 0, notes: req.body.notes });
    res.status(201).json(await entry.populate("technician", "name"));
  } catch (error) { next(error); }
});

router.post("/clock-out/:id", async (req, res, next) => {
  try {
    const entry = await TimeEntry.findById(req.params.id);
    if (!entry || entry.clockOut) return res.status(404).json({ message: "Active timer not found" });
    entry.clockOut = new Date();
    entry.minutes = Math.max(1, Math.round((entry.clockOut - entry.clockIn) / 60000));
    await entry.save();
    res.json(entry);
  } catch (error) { next(error); }
});

export default router;
