import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const [customers, vehicles, activeOrders, completedOrders, recentOrders] = await Promise.all([
      Customer.countDocuments(),
      Vehicle.countDocuments(),
      WorkOrder.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
      WorkOrder.find({ status: "completed" }),
      WorkOrder.find().populate("customer", "name").populate("vehicle", "year make model").sort({ createdAt: -1 }).limit(5),
    ]);
    const revenue = completedOrders.reduce((sum, order) => sum + order.subtotal, 0);
    const partsCost = completedOrders.reduce((sum, order) => sum + order.partsCost, 0);
    const grossProfit = revenue - partsCost;

    const monthlyMap = new Map();
    for (const order of completedOrders) {
      const date = order.completedAt || order.updatedAt;
      const month = date.toISOString().slice(0, 7);
      const item = monthlyMap.get(month) || { month, revenue: 0, partsCost: 0, grossProfit: 0, orders: 0 };
      item.revenue += order.subtotal;
      item.partsCost += order.partsCost;
      item.grossProfit += order.grossProfit;
      item.orders += 1;
      monthlyMap.set(month, item);
    }
    const monthly = [...monthlyMap.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);
    const currentMonth = new Date().toISOString().slice(0, 7);
    const current = monthlyMap.get(currentMonth) || { month: currentMonth, revenue: 0, partsCost: 0, grossProfit: 0, orders: 0 };

    res.json({ customers, vehicles, activeOrders, revenue, partsCost, grossProfit, currentMonth: current, monthly, recentOrders });
  } catch (error) {
    next(error);
  }
});

export default router;
