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
import { requireAuth } from "./middleware/auth.js";
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
  app.use("/api/dashboard", requireAuth, dashboardRoutes);
  app.use("/api/customers", requireAuth, customerRoutes);
  app.use("/api/vehicles", requireAuth, vehicleRoutes);
  app.use("/api/work-orders", requireAuth, workOrderRoutes);
  app.use("/api/estimates", requireAuth, estimateRoutes);
  app.use("/api/assistant", requireAuth, assistantRoutes);
  app.use("/api/search", requireAuth, searchRoutes);
  app.use("/api/scanner-reports", requireAuth, scannerReportRoutes);
  app.use("/api/receipt-reader", requireAuth, receiptReaderRoutes);

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
