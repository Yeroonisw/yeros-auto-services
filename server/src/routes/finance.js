import express from "express";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";
import WorkOrder from "../models/WorkOrder.js";
import Customer from "../models/Customer.js";
import Bill from "../models/Bill.js";
import { recordAudit } from "../services/audit.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const to = req.query.to ? new Date(req.query.to.length === 10 ? `${req.query.to}T23:59:59.999Z` : req.query.to) : new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return res.status(400).json({ message: "Choose a valid date range" });
    const [expenses, payments, completedOrders, bills] = await Promise.all([
      Expense.find({ date: { $gte: from, $lte: to } }).populate("createdBy", "name").sort({ date: -1 }),
      Payment.find({ createdAt: { $gte: from, $lte: to } }).populate("customer", "name").populate("workOrder", "orderNumber").sort({ createdAt: -1 }),
      WorkOrder.find({ status: "completed", completedAt: { $gte: from, $lte: to } }),
      Bill.find({ $or: [
        { dueDate: { $gte: from, $lte: to } },
        { status: { $ne: "paid" }, dueDate: { $lt: from } },
        { status: "paid", paidAt: { $gte: from, $lte: to } },
      ] }).sort({ dueDate: 1 }),
    ]);
    const sales = completedOrders.reduce((sum, order) => sum + Number(order.subtotal || 0), 0);
    const partsCost = completedOrders.reduce((sum, order) => sum + Number(order.partsCost || 0), 0);
    const operatingExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const collected = payments.filter((payment) => ["paid", "refunded"].includes(payment.status)).reduce((sum, payment) => {
      const isRefund = payment.type === "refund" || payment.status === "refunded";
      return sum + (isRefund ? -1 : 1) * Number(payment.amount || 0);
    }, 0);
    const categories = expenses.reduce((result, expense) => ({ ...result, [expense.category]: (result[expense.category] || 0) + expense.amount }), {});
    const pendingBills = await Bill.find({ status: { $ne: "paid" } }).select("amount dueDate status");
    const unpaidTotal = pendingBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const today = now.toISOString().slice(0, 10);
    const overdueBills = pendingBills.filter((bill) => bill.dueDate.toISOString().slice(0, 10) < today).length;
    res.json({ expenses, payments, bills, summary: { sales, partsCost, grossProfit: sales - partsCost, operatingExpenses, netProfit: sales - partsCost - operatingExpenses, collected, outstanding: Math.max(0, sales - collected), categories, unpaidBills: unpaidTotal, overdueBills } });
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

router.post("/bills", async (req, res, next) => {
  try {
    const bill = await Bill.create({ ...req.body, createdBy: req.user._id });
    await recordAudit(req, "create", "Bill", bill, `Recorded bill from ${bill.vendor}`);
    res.status(201).json(bill);
  } catch (error) { next(error); }
});

router.patch("/bills/:id", async (req, res, next) => {
  try {
    const allowed = ["status", "paidAt", "paymentMethod", "reference"];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    if (updates.status && !["pending", "scheduled", "paid"].includes(updates.status)) return res.status(400).json({ message: "Invalid bill status" });
    if (updates.status === "paid" && bill.status !== "paid") {
      bill.status = "paid";
      bill.paidAt = updates.paidAt ? new Date(updates.paidAt) : new Date();
      bill.paymentMethod = updates.paymentMethod || bill.paymentMethod;
      bill.reference = updates.reference || bill.reference;
      const expense = await Expense.create({
        category: bill.category,
        description: bill.description,
        amount: bill.amount,
        date: bill.paidAt,
        vendor: bill.vendor,
        paymentMethod: bill.paymentMethod,
        createdBy: req.user._id,
      });
      bill.expenseRecord = expense._id;
      await bill.save();
    } else {
      for (const [key, value] of Object.entries(updates)) bill[key] = value;
      await bill.save();
    }
    await recordAudit(req, "update", "Bill", bill, `Updated bill from ${bill.vendor}`);
    res.json(bill);
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
