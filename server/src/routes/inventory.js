import express from "express";
import Part from "../models/Part.js";
import WorkOrder from "../models/WorkOrder.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Math.max(10, Number(req.query.limit || 25)));
    const search = String(req.query.search || "").trim();
    const filter = {
      active: req.query.archived === "true" ? false : true,
      ...(search ? { $or: [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { supplier: { $regex: search, $options: "i" } },
      ] } : {}),
    };
    const [items, total, lowStockCount, totals] = await Promise.all([
      Part.find(filter).sort({ lowStock: -1, name: 1 }).skip((page - 1) * limit).limit(limit),
      Part.countDocuments(filter),
      Part.countDocuments({ active: true, $expr: { $lte: ["$quantity", "$minimumStock"] } }),
      Part.aggregate([{ $match: { active: true } }, { $group: {
        _id: null,
        inventoryValue: { $sum: { $multiply: ["$quantity", "$cost"] } },
        potentialRevenue: { $sum: { $multiply: ["$quantity", "$salePrice"] } },
        units: { $sum: "$quantity" },
      } }]),
    ]);
    res.json({
      items,
      pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
      summary: { lowStock: lowStockCount, ...(totals[0] || { inventoryValue: 0, potentialRevenue: 0, units: 0 }) },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const part = await Part.create(req.body);
    await recordAudit(req, "create", "Part", part, `Added ${part.name} to inventory`);
    res.status(201).json(part);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!part) return res.status(404).json({ message: "Part not found" });
    await recordAudit(req, "update", "Part", part, `Updated inventory item ${part.name}`);
    res.json(part);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/adjust", async (req, res, next) => {
  try {
    const amount = Number(req.body.amount || 0);
    if (!Number.isFinite(amount) || amount === 0) return res.status(400).json({ message: "Enter a valid adjustment" });
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ message: "Part not found" });
    const nextQuantity = Number(part.quantity || 0) + amount;
    if (nextQuantity < 0) return res.status(400).json({ message: "Inventory cannot be negative" });
    part.quantity = nextQuantity;
    await part.save();
    await recordAudit(req, "stock_adjustment", "Part", part, `${amount > 0 ? "Added" : "Used"} ${Math.abs(amount)} ${part.name}`, { amount });
    res.json(part);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/use", async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity || 1);
    const [part, order] = await Promise.all([Part.findById(req.params.id), WorkOrder.findById(req.body.workOrder)]);
    if (!part) return res.status(404).json({ message: "Part not found" });
    if (!order) return res.status(404).json({ message: "Work order not found" });
    if (quantity <= 0 || quantity > part.quantity) return res.status(400).json({ message: "Not enough inventory for this quantity" });
    part.quantity -= quantity;
    order.partsUsed.push({ part: part._id, name: part.name, sku: part.sku, quantity, cost: part.cost, salePrice: part.salePrice });
    await Promise.all([part.save(), order.save()]);
    await recordAudit(req, "part_used", "WorkOrder", order, `Used ${quantity} ${part.name} on ${order.orderNumber}`, { part: part._id });
    res.json({ part, order });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!part) return res.status(404).json({ message: "Part not found" });
    await recordAudit(req, "archive", "Part", part, `Archived ${part.name}`);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
