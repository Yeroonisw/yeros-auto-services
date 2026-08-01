import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import customerRoutes from "./routes/customers.js";
import vehicleRoutes from "./routes/vehicles.js";
import workOrderRoutes from "./routes/workOrders.js";
import dashboardRoutes from "./routes/dashboard.js";
import estimateRoutes from "./routes/estimates.js";
import assistantRoutes from "./routes/assistant.js";
import searchRoutes from "./routes/search.js";
import scannerReportRoutes from "./routes/scannerReports.js";
import receiptReaderRoutes from "./routes/receiptReader.js";
import appointmentRoutes from "./routes/appointments.js";
import inventoryRoutes from "./routes/inventory.js";
import reminderRoutes from "./routes/reminders.js";
import securityRoutes from "./routes/security.js";
import inspectionRoutes from "./routes/inspections.js";
import publicInspectionRoutes from "./routes/publicInspections.js";
import financeRoutes from "./routes/finance.js";
import technicianRoutes from "./routes/technicians.js";
import portalRoutes from "./routes/portal.js";
import workshopRoutes from "./routes/workshop.js";
import purchaseRoutes from "./routes/purchases.js";
import reportRoutes from "./routes/reports.js";
import marketingRoutes from "./routes/marketing.js";
import { requireAuth, requirePermission } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(currentDirectory, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
  app.use(express.json({ limit: "12mb" }));

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/portal", portalRoutes);
  app.use("/api/public/inspections", publicInspectionRoutes);
  app.use("/api/dashboard", requireAuth, requirePermission("dashboard"), dashboardRoutes);
  app.use("/api/customers", requireAuth, requirePermission("customers"), customerRoutes);
  app.use("/api/vehicles", requireAuth, requirePermission("vehicles"), vehicleRoutes);
  app.use("/api/work-orders", requireAuth, requirePermission("work_orders"), workOrderRoutes);
  app.use("/api/estimates", requireAuth, requirePermission("estimates"), estimateRoutes);
  app.use("/api/assistant", requireAuth, assistantRoutes);
  app.use("/api/search", requireAuth, searchRoutes);
  app.use("/api/scanner-reports", requireAuth, scannerReportRoutes);
  app.use("/api/receipt-reader", requireAuth, receiptReaderRoutes);
  app.use("/api/appointments", requireAuth, requirePermission("appointments"), appointmentRoutes);
  app.use("/api/inventory", requireAuth, requirePermission("inventory"), inventoryRoutes);
  app.use("/api/reminders", requireAuth, requirePermission("reminders"), reminderRoutes);
  app.use("/api/security", requireAuth, securityRoutes);
  app.use("/api/inspections", requireAuth, requirePermission("inspections"), inspectionRoutes);
  app.use("/api/finance", requireAuth, requirePermission("finance"), financeRoutes);
  app.use("/api/technicians", requireAuth, requirePermission("technicians"), technicianRoutes);
  app.use("/api/workshop", requireAuth, requirePermission("work_orders"), workshopRoutes);
  app.use("/api/purchases", requireAuth, requirePermission("inventory"), purchaseRoutes);
  app.use("/api/reports", requireAuth, requirePermission("finance"), reportRoutes);
  app.use("/api/marketing", requireAuth, requirePermission("customers"), marketingRoutes);

  if (process.env.NODE_ENV === "production" && fs.existsSync(clientIndexPath)) {
    app.use(express.static(clientDistPath));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(clientIndexPath));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@yerosautoservices.com").toLowerCase();
  if (!(await User.exists({ email }))) {
    await User.create({
      name: process.env.ADMIN_NAME || "Administrator",
      email,
      password: process.env.ADMIN_PASSWORD || "Admin123!",
    });
    console.log(`Admin user created: ${email}`);
  }
}

