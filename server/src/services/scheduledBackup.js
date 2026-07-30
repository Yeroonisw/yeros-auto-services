import zlib from "node:zlib";
import Customer from "../models/Customer.js";
import Vehicle from "../models/Vehicle.js";
import WorkOrder from "../models/WorkOrder.js";
import Appointment from "../models/Appointment.js";
import Estimate from "../models/Estimate.js";
import Part from "../models/Part.js";
import Inspection from "../models/Inspection.js";
import Expense from "../models/Expense.js";
import Payment from "../models/Payment.js";

async function createBackupPayload() {
  const [customers, vehicles, workOrders, appointments, estimates, parts, inspections, expenses, payments] = await Promise.all([
    Customer.find().lean(), Vehicle.find().lean(), WorkOrder.find().lean(), Appointment.find().lean(), Estimate.find().lean(), Part.find().lean(), Inspection.find().lean(), Expense.find().lean(), Payment.find().lean(),
  ]);
  const json = JSON.stringify({ version: 2, createdAt: new Date(), business: "Yeros Auto Services LLC", data: { customers, vehicles, workOrders, appointments, estimates, parts, inspections, expenses, payments } });
  return zlib.gzipSync(json).toString("base64");
}

export async function runScheduledBackup() {
  if (!process.env.BACKUP_WEBHOOK_URL) return;
  const payload = await createBackupPayload();
  const response = await fetch(process.env.BACKUP_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(process.env.BACKUP_WEBHOOK_SECRET ? { Authorization: `Bearer ${process.env.BACKUP_WEBHOOK_SECRET}` } : {}) },
    body: JSON.stringify({ fileName: `yeros-backup-${new Date().toISOString().slice(0, 10)}.json.gz`, encoding: "gzip-base64", payload }),
  });
  if (!response.ok) throw new Error(`Backup provider returned ${response.status}`);
}

export function startScheduledBackups() {
  runScheduledBackup().catch((error) => console.error("Scheduled backup failed:", error.message));
  const timer = setInterval(() => runScheduledBackup().catch((error) => console.error("Scheduled backup failed:", error.message)), 24 * 60 * 60 * 1000);
  timer.unref();
}
