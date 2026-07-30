import Appointment from "../models/Appointment.js";
import Estimate from "../models/Estimate.js";
import WorkOrder from "../models/WorkOrder.js";
import Reminder from "../models/Reminder.js";
import CustomerInteraction from "../models/CustomerInteraction.js";

async function ensureReminder(filter, values) {
  if (await Reminder.exists(filter)) return;
  await Reminder.create(values);
}

export async function runAutomationCycle() {
  const now = new Date();
  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const [appointments, estimates, followUps] = await Promise.all([
    Appointment.find({ scheduledAt: { $gte: now, $lte: nextDay }, status: { $in: ["scheduled", "confirmed"] } }).populate("customer", "name phone email"),
    Estimate.find({ status: { $in: ["draft", "sent"] }, createdAt: { $lte: sevenDaysAgo } }).populate("customer", "name phone email"),
    WorkOrder.find({ status: "completed", completedAt: { $lte: sevenDaysAgo } }).populate("customer", "name phone email").sort({ completedAt: -1 }).limit(50),
  ]);
  for (const item of appointments) await ensureReminder({ type: "appointment", relatedId: item._id }, {
    type: "appointment", customer: item.customer._id, vehicle: item.vehicle, relatedModel: "Appointment", relatedId: item._id,
    title: "Upcoming appointment", message: `Hello ${item.customer.name}, this is a reminder for your Yeros Auto Services appointment on ${item.scheduledAt.toLocaleString("en-US")}.`, dueAt: now,
  });
  for (const item of estimates) await ensureReminder({ type: "estimate", relatedId: item._id }, {
    type: "estimate", customer: item.customer._id, vehicle: item.vehicle, relatedModel: "Estimate", relatedId: item._id,
    title: "Estimate follow-up", message: `Hello ${item.customer.name}, we are following up on estimate ${item.estimateNumber}. Reply if you would like to schedule.`, dueAt: now,
  });
  for (const item of followUps) await ensureReminder({ type: "repair_follow_up", relatedId: item._id }, {
    type: "repair_follow_up", customer: item.customer._id, vehicle: item.vehicle, relatedModel: "WorkOrder", relatedId: item._id,
    title: "Post-repair follow-up", message: `Hello ${item.customer.name}, Yeros Auto Services is checking in after repair ${item.orderNumber}. Is everything running well?`, dueAt: new Date(item.completedAt.getTime() + 7 * 86400000),
  });

  if (!process.env.AUTOMATION_WEBHOOK_URL) return;
  const due = await Reminder.find({ status: "pending", dueAt: { $lte: now } }).populate("customer", "name phone email").limit(50);
  for (const reminder of due) {
    const response = await fetch(process.env.AUTOMATION_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(process.env.AUTOMATION_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.AUTOMATION_WEBHOOK_SECRET}` } : {}) },
      body: JSON.stringify({ channel: "whatsapp", customer: reminder.customer, message: reminder.message, reminderId: reminder.id, source: "yeros-auto-services-scheduler" }),
    });
    if (!response.ok) continue;
    reminder.status = "sent"; reminder.sentAt = new Date(); reminder.channel = "whatsapp"; await reminder.save();
    await CustomerInteraction.create({ customer: reminder.customer._id, type: "whatsapp", direction: "outbound", note: reminder.message });
  }
}

export function startAutomationScheduler() {
  runAutomationCycle().catch((error) => console.error("Automation cycle failed:", error.message));
  const timer = setInterval(() => runAutomationCycle().catch((error) => console.error("Automation cycle failed:", error.message)), 15 * 60 * 1000);
  timer.unref();
}
