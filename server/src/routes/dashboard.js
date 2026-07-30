import express from "express";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Appointment from "../models/Appointment.js";
import Estimate from "../models/Estimate.js";
import Part from "../models/Part.js";
import Expense from "../models/Expense.js";

const router = express.Router();
const CACHE_MS = 60_000;
let cache = { at: 0, value: null };

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date) {
  const result = startOfDay(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

function orderDate(order) {
  return order.completedAt || order.updatedAt || order.createdAt;
}

function financials(orders) {
  return orders.reduce((result, order) => {
    result.revenue += Number(order.subtotal || 0);
    result.expenses += Number(order.partsCost || 0);
    result.profit += Number(order.grossProfit || 0);
    result.orders += 1;
    return result;
  }, { revenue: 0, expenses: 0, profit: 0, orders: 0 });
}

function percent(value, previous) {
  return previous ? ((value - previous) / previous) * 100 : value ? 100 : 0;
}

router.get("/", async (req, res, next) => {
  try {
    if (cache.value && Date.now() - cache.at < CACHE_MS && req.query.refresh !== "true") {
      res.set("X-Dashboard-Cache", "HIT");
      return res.json(cache.value);
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekStart = startOfWeek(now);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const nextWeek = new Date(todayStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const overdueThreshold = new Date(now.getTime() - 2 * 86400000);

    const [customersList, vehicles, allOrders, recentOrders, upcomingAppointments, appointments, openEstimates, lowStock, operatingExpenses] = await Promise.all([
      Customer.find().select("name phone createdAt").lean(),
      Vehicle.find().populate("customer", "name phone"),
      WorkOrder.find().populate("customer", "name phone"),
      WorkOrder.find().populate("customer", "name").populate("vehicle", "year make model").sort({ createdAt: -1 }).limit(6),
      Appointment.find({ scheduledAt: { $gte: todayStart, $lt: nextWeek }, status: { $in: ["scheduled", "confirmed", "in_progress"] } })
        .populate("customer", "name phone").populate("vehicle", "year make model").sort({ scheduledAt: 1 }).limit(10),
      Appointment.find({ scheduledAt: { $gte: monthStart } }).select("status scheduledAt").lean(),
      Estimate.find({ status: { $in: ["draft", "sent"] } }).populate("customer", "name phone").sort({ createdAt: 1 }).limit(20),
      Part.find({ active: true, $expr: { $lte: ["$quantity", "$minimumStock"] } }).sort({ quantity: 1 }).limit(8),
      Expense.find({ date: { $gte: yearStart } }).lean(),
    ]);

    const completedOrders = allOrders.filter((order) => order.status === "completed");
    const byPeriod = {
      day: financials(completedOrders.filter((order) => orderDate(order) >= todayStart)),
      week: financials(completedOrders.filter((order) => orderDate(order) >= weekStart)),
      month: financials(completedOrders.filter((order) => orderDate(order) >= monthStart)),
      year: financials(completedOrders.filter((order) => orderDate(order) >= yearStart)),
    };
    for (const [period, start] of Object.entries({ day: todayStart, week: weekStart, month: monthStart, year: yearStart })) {
      const overhead = operatingExpenses.filter((expense) => new Date(expense.date) >= start).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      byPeriod[period].operatingExpenses = overhead;
      byPeriod[period].netProfit = byPeriod[period].profit - overhead;
    }
    const previousMonth = financials(completedOrders.filter((order) => {
      const date = orderDate(order);
      return date >= previousMonthStart && date < monthStart;
    }));

    const monthlyMap = new Map();
    for (const order of completedOrders) {
      const month = orderDate(order).toISOString().slice(0, 7);
      const item = monthlyMap.get(month) || { month, revenue: 0, partsCost: 0, expenses: 0, grossProfit: 0, orders: 0 };
      item.revenue += Number(order.subtotal || 0);
      item.partsCost += Number(order.partsCost || 0);
      item.expenses += Number(order.partsCost || 0);
      item.grossProfit += Number(order.grossProfit || 0);
      item.orders += 1;
      monthlyMap.set(month, item);
    }
    for (const expense of operatingExpenses) {
      const month = new Date(expense.date).toISOString().slice(0, 7);
      const item = monthlyMap.get(month) || { month, revenue: 0, partsCost: 0, expenses: 0, grossProfit: 0, orders: 0 };
      item.operatingExpenses = Number(item.operatingExpenses || 0) + Number(expense.amount || 0);
      monthlyMap.set(month, item);
    }
    for (const item of monthlyMap.values()) item.netProfit = item.grossProfit - Number(item.operatingExpenses || 0);
    const monthly = [...monthlyMap.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);
    const currentMonthKey = now.toISOString().slice(0, 7);
    const current = monthlyMap.get(currentMonthKey) || { month: currentMonthKey, revenue: 0, partsCost: 0, expenses: 0, operatingExpenses: 0, grossProfit: 0, netProfit: 0, orders: 0 };

    const serviceMap = new Map();
    for (const order of completedOrders) {
      for (const service of order.services || []) {
        const name = service.description?.trim() || "Other service";
        const item = serviceMap.get(name) || { name, jobs: 0, revenue: 0, cost: 0, profit: 0 };
        const quantity = Number(service.quantity || 0);
        const revenue = quantity * Number(service.price || 0);
        const cost = quantity * Number(service.cost || 0);
        item.jobs += quantity;
        item.revenue += revenue;
        item.cost += cost;
        item.profit += revenue - cost;
        serviceMap.set(name, item);
      }
    }
    const serviceProfit = [...serviceMap.values()].sort((a, b) => b.profit - a.profit);

    const customerVisits = new Map();
    for (const order of completedOrders) {
      const id = String(order.customer?._id || order.customer || "");
      if (id) customerVisits.set(id, (customerVisits.get(id) || 0) + 1);
    }
    const customerSegments = {
      new: customersList.filter((customer) => customer.createdAt >= monthStart).length,
      recurring: [...customerVisits.values()].filter((visits) => visits > 1).length,
      oneTime: [...customerVisits.values()].filter((visits) => visits === 1).length,
    };
    const appointmentStatus = ["scheduled", "confirmed", "cancelled", "completed", "in_progress", "no_show"]
      .reduce((result, status) => ({ ...result, [status]: appointments.filter((item) => item.status === status).length }), {});
    const overdueOrders = allOrders.filter((order) => ["pending", "in_progress"].includes(order.status) && new Date(order.openedAt || order.createdAt) < overdueThreshold);

    const oilReminders = vehicles.filter((vehicle) => ["overdue", "due_soon"].includes(vehicle.oilChangeStatus?.status)).slice(0, 8).map((vehicle) => ({
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

    const value = {
      customers: customersList.length,
      vehicles: vehicles.length,
      activeOrders: allOrders.filter((order) => ["pending", "in_progress"].includes(order.status)).length,
      revenue: financials(completedOrders).revenue,
      partsCost: financials(completedOrders).expenses,
      grossProfit: financials(completedOrders).profit,
      sales: byPeriod,
      currentMonth: current,
      previousMonth,
      comparison: {
        revenue: percent(byPeriod.month.revenue, previousMonth.revenue),
        grossProfit: percent(byPeriod.month.profit, previousMonth.profit),
        orders: percent(byPeriod.month.orders, previousMonth.orders),
      },
      monthly,
      recentOrders,
      topServices: serviceProfit.slice(0, 7),
      serviceProfit: serviceProfit.slice(0, 10),
      upcomingAppointments,
      todayAppointments: upcomingAppointments.filter((item) => item.scheduledAt >= todayStart && item.scheduledAt < tomorrow).length,
      appointmentStatus,
      overdueOrders: overdueOrders.slice(0, 8),
      overdueOrderCount: overdueOrders.length,
      customerSegments,
      lowStock,
      reminders: { oilChanges: oilReminders, estimates: estimateReminders, total: oilReminders.length + estimateReminders.length + overdueOrders.length + lowStock.length },
      cache: { generatedAt: now, ttlSeconds: CACHE_MS / 1000 },
    };
    cache = { at: Date.now(), value };
    res.set("X-Dashboard-Cache", "MISS");
    res.json(value);
  } catch (error) {
    next(error);
  }
});

export default router;
