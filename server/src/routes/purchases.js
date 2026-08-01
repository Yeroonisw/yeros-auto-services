import express from "express";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Part from "../models/Part.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();
router.get("/", async (req, res, next) => {
  try { res.json(await PurchaseOrder.find().populate("items.part", "name sku quantity").sort({ createdAt: -1 }).limit(100)); }
  catch (error) { next(error); }
});
router.post("/", async (req, res, next) => {
  try {
    const ids = (req.body.items || []).map((item) => item.part);
    const parts = await Part.find({ _id: { $in: ids } });
    if (!parts.length || parts.length !== new Set(ids.map(String)).size) return res.status(400).json({ message: "Choose valid inventory parts" });
    const map = new Map(parts.map((item) => [String(item._id), item]));
    const items = req.body.items.map((item) => ({ part: item.part, name: map.get(String(item.part)).name, sku: map.get(String(item.part)).sku, quantity: Number(item.quantity), cost: Number(item.cost ?? map.get(String(item.part)).cost) }));
    const order = await PurchaseOrder.create({ ...req.body, items, createdBy: req.user._id });
    await recordAudit(req, "create", "PurchaseOrder", order, `Created ${order.purchaseOrderNumber}`);
    res.status(201).json(order);
  } catch (error) { next(error); }
});
router.put("/:id", async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Purchase order not found" });
    await recordAudit(req, "update", "PurchaseOrder", order, `Updated ${order.purchaseOrderNumber}`);
    res.json(order);
  } catch (error) { next(error); }
});
router.post("/:id/receive", async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Purchase order not found" });
    for (const item of order.items) {
      const amount = Number(req.body.items?.find((entry) => String(entry.item) === String(item._id))?.quantity ?? item.quantity - item.received);
      const accepted = Math.max(0, Math.min(amount, item.quantity - item.received));
      if (accepted) { item.received += accepted; await Part.findByIdAndUpdate(item.part, { $inc: { quantity: accepted }, $set: { cost: item.cost } }); }
    }
    const received = order.items.reduce((sum, item) => sum + item.received, 0);
    const ordered = order.items.reduce((sum, item) => sum + item.quantity, 0);
    order.status = received >= ordered ? "received" : "partial";
    await order.save();
    await recordAudit(req, "receive", "PurchaseOrder", order, `Received parts for ${order.purchaseOrderNumber}`);
    res.json(order);
  } catch (error) { next(error); }
});
export default router;
