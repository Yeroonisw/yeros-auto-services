import express from "express";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import { recordAudit } from "../services/audit.js";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Appointment from "../models/Appointment.js";
import Estimate from "../models/Estimate.js";
import Part from "../models/Part.js";
import Reminder from "../models/Reminder.js";
import CustomerInteraction from "../models/CustomerInteraction.js";
import LoginAttempt from "../models/LoginAttempt.js";
import { createTotpSecret, verifyTotp } from "../services/totp.js";
import Inspection from "../models/Inspection.js";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import TimeEntry from "../models/TimeEntry.js";

const router = express.Router();

router.get("/system-status", (req, res) => {
  res.json({
    recovery: Boolean(process.env.ADMIN_RECOVERY_CODE),
    messaging: Boolean(process.env.AUTOMATION_WEBHOOK_URL),
    payments: Boolean(process.env.PAYMENT_LINK_BASE_URL),
    backups: Boolean(process.env.BACKUP_WEBHOOK_URL),
    twoFactorAvailable: true,
  });
});

router.get("/users", async (req, res, next) => {
  try {
    res.json(await User.find().sort({ createdAt: 1 }));
  } catch (error) {
    next(error);
  }
});

router.post("/users", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator permission required" });
    const user = await User.create(req.body);
    await recordAudit(req, "create", "User", user, `Created ${user.role} account for ${user.email}`);
    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json(safeUser);
  } catch (error) {
    next(error);
  }
});

router.put("/users/:id", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator permission required" });
    const allowed = ["name", "role", "active", "permissions"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    await recordAudit(req, "update", "User", user, `Updated access for ${user.email}`);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

router.post("/change-password", async (req, res, next) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must contain at least 8 characters" });
    const user = await User.findById(req.user._id).select("+password");
    if (!user || !(await user.matchesPassword(currentPassword))) return res.status(400).json({ message: "Current password is incorrect" });
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    await recordAudit(req, "password_change", "User", user, `Password changed for ${user.email}`);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/audit", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(10, Number(req.query.limit || 30)));
    const filter = req.query.entityType ? { entityType: req.query.entityType } : {};
    const [items, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ items, pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    next(error);
  }
});

router.get("/login-activity", async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 86400000);
    const [items, failed] = await Promise.all([
      LoginAttempt.find().sort({ createdAt: -1 }).limit(50),
      LoginAttempt.countDocuments({ success: false, createdAt: { $gte: since } }),
    ]);
    res.json({ items, failedLast30Days: failed });
  } catch (error) { next(error); }
});

router.post("/2fa/setup", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+twoFactorSecret");
    const secret = createTotpSecret();
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false;
    await user.save();
    const issuer = encodeURIComponent("Yeros Auto Services");
    const account = encodeURIComponent(user.email);
    res.json({ secret, otpauthUrl: `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}` });
  } catch (error) { next(error); }
});

router.post("/2fa/enable", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+twoFactorSecret");
    if (!user?.twoFactorSecret || !verifyTotp(user.twoFactorSecret, req.body.code)) return res.status(400).json({ message: "Invalid authentication code" });
    user.twoFactorEnabled = true; await user.save();
    await recordAudit(req, "2fa_enable", "User", user, `Enabled two-factor authentication for ${user.email}`);
    res.json({ message: "Two-factor authentication enabled" });
  } catch (error) { next(error); }
});

router.post("/2fa/disable", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("+password +twoFactorSecret");
    if (!user || !(await user.matchesPassword(String(req.body.password || "")))) return res.status(400).json({ message: "Password is incorrect" });
    user.twoFactorEnabled = false; user.twoFactorSecret = undefined; await user.save();
    await recordAudit(req, "2fa_disable", "User", user, `Disabled two-factor authentication for ${user.email}`);
    res.json({ message: "Two-factor authentication disabled" });
  } catch (error) { next(error); }
});

router.get("/backup", async (req, res, next) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ message: "Administrator permission required" });
    const [customers, vehicles, workOrders, appointments, estimates, parts, reminders, interactions, audit, inspections, expenses, payments, timeEntries] = await Promise.all([
      Customer.find().lean(), Vehicle.find().lean(), WorkOrder.find().lean(), Appointment.find().lean(),
      Estimate.find().lean(), Part.find().lean(), Reminder.find().lean(), CustomerInteraction.find().lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(5000).lean(),
      Inspection.find().lean(), Expense.find().lean(), Payment.find().lean(), TimeEntry.find().lean(),
    ]);
    const backup = { version: 2, createdAt: new Date(), business: "Yeros Auto Services LLC", data: { customers, vehicles, workOrders, appointments, estimates, parts, reminders, interactions, audit, inspections, expenses, payments, timeEntries } };
    await recordAudit(req, "backup_export", "System", "database", "Exported encrypted-account-safe business backup");
    res.attachment(`yeros-backup-${new Date().toISOString().slice(0, 10)}.json`);
    res.json(backup);
  } catch (error) {
    next(error);
  }
});

export default router;
