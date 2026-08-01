import express from "express";
import WorkOrder from "../models/WorkOrder.js";
import Payment from "../models/Payment.js";
import Expense from "../models/Expense.js";
import Customer from "../models/Customer.js";

const router = express.Router();
const csv = (rows) => rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
const range = (req) => ({ $gte: req.query.from ? new Date(req.query.from) : new Date(new Date().getFullYear(), 0, 1), $lte: req.query.to ? new Date(`${req.query.to}T23:59:59.999`) : new Date() });

router.get("/summary", async (req, res, next) => {
  try {
    const dates = range(req);
    const [orders, payments, expenses, customers] = await Promise.all([
      WorkOrder.find({ completedAt: dates, status: "completed" }), Payment.find({ createdAt: dates }), Expense.find({ date: dates }), Customer.countDocuments({ createdAt: dates }),
    ]);
    const sales = orders.reduce((sum, item) => sum + item.total, 0);
    const costs = orders.reduce((sum, item) => sum + item.partsCost, 0);
    const collected = payments.filter((item) => item.status === "paid").reduce((sum, item) => sum + item.amount, 0);
    const operating = expenses.reduce((sum, item) => sum + item.amount, 0);
    res.json({ sales, collected, outstanding: Math.max(0, sales - collected), costs, operating, netProfit: sales - costs - operating, completedOrders: orders.length, newCustomers: customers });
  } catch (error) { next(error); }
});
router.get("/transactions.csv", async (req, res, next) => {
  try {
    const dates = range(req);
    const [payments, expenses] = await Promise.all([Payment.find({ createdAt: dates }).populate("customer", "name").populate("workOrder", "orderNumber"), Expense.find({ date: dates })]);
    const rows = [["Date", "Type", "Customer / Payee", "Reference", "Amount", "Status"]];
    payments.forEach((item) => rows.push([item.createdAt.toISOString(), "Income", item.customer?.name, item.workOrder?.orderNumber || item.reference, item.amount, item.status]));
    expenses.forEach((item) => rows.push([item.date.toISOString(), "Expense", item.vendor, item.description, -item.amount, item.category]));
    res.set("Content-Type", "text/csv").attachment("Yeros-transactions.csv").send(csv(rows));
  } catch (error) { next(error); }
});
router.get("/customers.csv", async (req, res, next) => {
  try {
    const customers = await Customer.find().sort({ name: 1 });
    res.set("Content-Type", "text/csv").attachment("Yeros-customers.csv").send(csv([["Name", "Phone", "Email", "Address", "Created"], ...customers.map((item) => [item.name, item.phone, item.email, item.address, item.createdAt?.toISOString()])]));
  } catch (error) { next(error); }
});
export default router;
