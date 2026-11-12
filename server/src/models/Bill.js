import mongoose from "mongoose";

const billSchema = new mongoose.Schema({
  vendor: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: ["fuel", "tools", "payroll", "insurance", "rent", "parts", "marketing", "software", "taxes", "other"], default: "other", index: true },
  amount: { type: Number, min: 0.01, required: true },
  dueDate: { type: Date, required: true, index: true },
  status: { type: String, enum: ["pending", "scheduled", "paid"], default: "pending", index: true },
  paidAt: Date,
  paymentMethod: { type: String, trim: true },
  reference: { type: String, trim: true },
  expenseRecord: { type: mongoose.Schema.Types.ObjectId, ref: "Expense" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

billSchema.index({ status: 1, dueDate: 1 });
export default mongoose.model("Bill", billSchema);
