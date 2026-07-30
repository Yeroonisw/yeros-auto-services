import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  workOrder: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", index: true },
  estimate: { type: mongoose.Schema.Types.ObjectId, ref: "Estimate", index: true },
  type: { type: String, enum: ["deposit", "invoice", "refund"], default: "invoice" },
  amount: { type: Number, min: 0.01, required: true },
  method: { type: String, enum: ["cash", "card", "zelle", "cash_app", "check", "online", "other"], required: true },
  status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "paid", index: true },
  reference: { type: String, trim: true },
  provider: { type: String, trim: true, default: "manual" },
  paymentUrl: { type: String, trim: true },
  paidAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

paymentSchema.index({ paidAt: -1, status: 1 });
export default mongoose.model("Payment", paymentSchema);
