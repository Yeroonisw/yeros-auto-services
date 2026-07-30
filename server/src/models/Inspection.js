import crypto from "node:crypto";
import mongoose from "mongoose";

const inspectionItemSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true },
  label: { type: String, required: true, trim: true },
  condition: { type: String, enum: ["good", "attention", "urgent", "not_checked"], default: "not_checked" },
  notes: { type: String, trim: true },
  photoUrl: { type: String, trim: true },
}, { _id: true });

const inspectionSchema = new mongoose.Schema({
  inspectionNumber: { type: String, unique: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  workOrder: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", index: true },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mileage: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ["draft", "sent", "approved", "declined", "completed"], default: "draft", index: true },
  items: { type: [inspectionItemSchema], default: [] },
  summary: { type: String, trim: true },
  recommendedServices: { type: [String], default: [] },
  customerSignature: String,
  customerDecisionAt: Date,
  publicToken: { type: String, unique: true, index: true, default: () => crypto.randomBytes(24).toString("hex") },
  sentAt: Date,
}, { timestamps: true });

inspectionSchema.index({ createdAt: -1, status: 1 });
inspectionSchema.pre("validate", async function assignNumber(next) {
  if (this.inspectionNumber) return next();
  const latest = await this.constructor.findOne({}, { inspectionNumber: 1 }).sort({ createdAt: -1 });
  const previous = Number(latest?.inspectionNumber?.replace(/\D/g, "")) || 0;
  this.inspectionNumber = `INS-${String(previous + 1).padStart(5, "0")}`;
  next();
});

export default mongoose.model("Inspection", inspectionSchema);
