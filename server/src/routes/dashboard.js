import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Appointment from "../models/Appointment.js";
import Estimate from "../models/Estimate.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(todayStart);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const [customers, vehicles, activeOrders, completedOrders, recentOrders, upcomingAppointments, openEstimates] = await Promise.all([
      Customer.countDocuments(),
      Vehicle.find().populate("customer", "name phone"),
      WorkOrder.countDocuments({ status: { $in: ["pending", "in_progress"] } }),
      WorkOrder.find({ status: "completed" }),
      WorkOrder.find().populate("customer", "name").populate("vehicle", "year make model").sort({ createdAt: -1 }).limit(5),
      Appointment.find({
        scheduledAt: { $gte: todayStart, $lt: nextWeek },
        status: { $in: ["scheduled", "confirmed", "in_progress"] },
      }).populate("customer", "name phone").populate("vehicle", "year make model").sort({ scheduledAt: 1 }).limit(8),
      Estimate.find({ status: { $in: ["draft", "sent"] } }).populate("customer", "name").sort({ createdAt: 1 }).limit(10),
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
    const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = previousDate.toISOString().slice(0, 7);
    const previous = monthlyMap.get(previousMonth) || { month: previousMonth, revenue: 0, partsCost: 0, grossProfit: 0, orders: 0 };
    const changePercent = (value, oldValue) => oldValue ? ((value - oldValue) / oldValue) * 100 : value ? 100 : 0;

    const serviceMap = new Map();
    for (const order of completedOrders) {
      for (const service of order.services || []) {
        const name = service.description?.trim() || "Other service";
        const item = serviceMap.get(name) || { name, jobs: 0, revenue: 0 };
        item.jobs += Number(service.quantity || 0);
        item.revenue += Number(service.quantity || 0) * Number(service.price || 0);
        serviceMap.set(name, item);
      }
    }
    const topServices = [...serviceMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const oilReminders = vehicles
      .filter((vehicle) => ["overdue", "due_soon"].includes(vehicle.oilChangeStatus?.status))
      .sort((a, b) => (a.oilChangeStatus.status === "overdue" ? -1 : 1) - (b.oilChangeStatus.status === "overdue" ? -1 : 1))
      .slice(0, 8)
      .map((vehicle) => ({
        _id: vehicle._id,
        vehicle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        customer: vehicle.customer,
        status: vehicle.oilChangeStatus.status,
        milesRemaining: vehicle.oilChangeStatus.milesRemaining,
        daysRemaining: vehicle.oilChangeStatus.daysRemaining,
      }));
    const estimateReminders = openEstimates.map((estimate) => ({
      _id: estimate._id,
      estimateNumber: estimate.estimateNumber,
      customer: estimate.customer,
      status: estimate.status,
      ageDays: Math.max(0, Math.floor((now - estimate.createdAt) / 86400000)),
      validUntil: estimate.validUntil,
      total: estimate.total,
    }));
    const todayAppointments = upcomingAppointments.filter((item) => item.scheduledAt >= todayStart && item.scheduledAt < tomorrow);

    res.json({
      customers,
      vehicles: vehicles.length,
      activeOrders,
      revenue,
      partsCost,
      grossProfit,
      currentMonth: current,
      previousMonth: previous,
      comparison: {
        revenue: changePercent(current.revenue, previous.revenue),
        grossProfit: changePercent(current.grossProfit, previous.grossProfit),
        orders: changePercent(current.orders, previous.orders),
      },
      monthly,
      recentOrders,
      topServices,
      upcomingAppointments,
      todayAppointments: todayAppointments.length,
      reminders: {
        oilChanges: oilReminders,
        estimates: estimateReminders,
        total: oilReminders.length + estimateReminders.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
