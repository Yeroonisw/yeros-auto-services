import express from "express";
import WorkOrder from "../models/WorkOrder.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();
const stages = ["scheduled", "check_in", "diagnosing", "waiting_approval", "waiting_parts", "ready_to_start", "working", "quality_check", "ready_pickup", "delivered"];

router.get("/", async (req, res, next) => {
  try {
    const orders = await WorkOrder.find({ status: { $nin: ["cancelled", "completed"] }, workflowStage: { $ne: "delivered" } })
      .populate("customer", "name phone").populate("vehicle", "year make model plate color")
      .populate("assignedTechnician", "name")
      .sort({ promisedAt: 1, createdAt: 1 });
    const columns = Object.fromEntries(stages.map((stage) => [stage, orders.filter((item) => item.workflowStage === stage)]));
    const overdue = orders.filter((item) => item.promisedAt && new Date(item.promisedAt) < new Date()).length;
    res.json({ stages, columns, summary: { active: orders.length, overdue, waitingParts: columns.waiting_parts.length, ready: columns.ready_pickup.length } });
  } catch (error) { next(error); }
});

router.put("/:id/stage", async (req, res, next) => {
  try {
    if (!stages.includes(req.body.stage)) return res.status(400).json({ message: "Invalid workshop stage" });
    const order = await WorkOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Work order not found" });
    order.workflowStage = req.body.stage;
    if (order.status === "completed" && req.body.stage !== "delivered") order.status = "in_progress";
    if (req.body.stage === "working" && !order.startedAt) order.startedAt = new Date();
    if (req.body.stage === "quality_check") order.qualityCheckedAt = new Date();
    if (req.body.stage === "delivered") { order.status = "completed"; order.completedAt ||= new Date(); }
    await order.save();
    await recordAudit(req, "workflow_stage", "WorkOrder", order, `${order.orderNumber} moved to ${req.body.stage}`);
    res.json(order);
  } catch (error) { next(error); }
});

export default router;
