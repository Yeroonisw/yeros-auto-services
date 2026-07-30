import express from "express";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import WorkOrder from "../models/WorkOrder.js";
import Customer from "../models/Customer.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = req.query.to ? new Date(req.query.to) : now;
    const [expenses, payments, completedOrders] = await Promise.all([
      Expense.find({ date: { $gte: from, $lte: to } }).populate("createdBy", "name").sort({ date: -1 }),
      Payment.find({ createdAt: { $gte: from, $lte: to } }).populate("customer", "name").populate("workOrder", "orderNumber").sort({ createdAt: -1 }),
      WorkOrder.find({ status: "completed", completedAt: { $gte: from, $lte: to } }),
    ]);
    const sales = completedOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
    const partsCost = completedOrders.reduce((sum, order) => sum + Number(order.partsCost || 0), 0);
    const operatingExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const collected = payments.filter((payment) => payment.status === "paid").reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const categories = expenses.reduce((result, expense) => ({ ...result, [expense.category]: (result[expense.category] || 0) + expense.amount }), {});
    res.json({ expenses, payments, summary: { sales, partsCost, grossProfit: sales - partsCost, operatingExpenses, netProfit: sales - partsCost - operatingExpenses, collected, outstanding: Math.max(0, sales - collected), categories } });
  } catch (error) { next(error); }
});

router.post("/expenses", async (req, res, next) => {
  try {
    const expense = await Expense.create({ ...req.body, createdBy: req.user._id });
    await recordAudit(req, "create", "Expense", expense, `Recorded ${expense.description} expense`);
    res.status(201).json(expense);
  } catch (error) { next(error); }
});

router.delete("/expenses/:id", async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    await recordAudit(req, "delete", "Expense", expense, `Deleted ${expense.description} expense`);
    res.status(204).end();
  } catch (error) { next(error); }
});

router.post("/payments", async (req, res, next) => {
  try {
    if (!(await Customer.exists({ _id: req.body.customer }))) return res.status(400).json({ message: "Select a valid customer" });
    const payment = await Payment.create({ ...req.body, paidAt: req.body.status === "paid" || !req.body.status ? new Date() : null, createdBy: req.user._id });
    if (payment.workOrder) {
      const order = await WorkOrder.findById(payment.workOrder);
      if (order) {
        const paid = await Payment.aggregate([{ $match: { workOrder: order._id, status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]);
        order.paymentStatus = (paid[0]?.total || 0) >= order.total ? "paid" : (paid[0]?.total || 0) > 0 ? "partial" : "unpaid";
        await order.save();
      }
    }
    await recordAudit(req, "create", "Payment", payment, `Recorded ${payment.type} payment`);
    res.status(201).json(payment);
  } catch (error) { next(error); }
});

router.post("/payment-link", async (req, res, next) => {
  try {
    const baseUrl = process.env.PAYMENT_LINK_BASE_URL;
    if (!baseUrl) return res.status(503).json({ message: "Online payment provider is not configured yet" });
    const url = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}amount=${encodeURIComponent(req.body.amount)}&reference=${encodeURIComponent(req.body.reference || "")}`;
    res.json({ url });
  } catch (error) { next(error); }
});

export default router;
