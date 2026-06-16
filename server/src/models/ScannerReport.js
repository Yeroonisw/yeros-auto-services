import mongoose from "mongoose";

const dtcSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "pending", "history"], default: "active" },
    module: { type: String, trim: true },
  },
  { _id: false },
);

const scannerReportSchema = new mongoose.Schema(
  {
    reportNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    scannerModel: { type: String, trim: true, default: "Autel MK900" },
    scanDate: { type: Date, default: Date.now },
    vin: { type: String, trim: true, uppercase: true },
    mileage: { type: Number, min: 0, default: 0 },
    dtcCodes: { type: [dtcSchema], default: [] },
    summary: { type: String, trim: true },
    rawText: { type: String, trim: true },
    sourceFileName: { type: String, trim: true },
    convertedWorkOrder: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder" },
  },
  { timestamps: true },
);

scannerReportSchema.pre("validate", async function assignReportNumber(next) {
  if (this.reportNumber) return next();
  const latest = await this.constructor.findOne({}, { reportNumber: 1 }).sort({ createdAt: -1 });
  const previous = Number(latest?.reportNumber?.replace(/\D/g, "")) || 0;
  this.reportNumber = `SCAN-${String(previous + 1).padStart(5, "0")}`;
  next();
});

export default mongoose.model("ScannerReport", scannerReportSchema);
