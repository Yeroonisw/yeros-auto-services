import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  category: { type: String, enum: ["fuel", "tools", "payroll", "insurance", "rent", "parts", "marketing", "software", "taxes", "other"], required: true, index: true },
  description: { type: String, required: true, trim: true },
  amount: { type: Number, min: 0, required: true },
  date: { type: Date, default: Date.now, index: true },
  vendor: { type: String, trim: true },
  paymentMethod: { type: String, trim: true },
  receiptUrl: { type: String, trim: true },
  recurring: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

expenseSchema.index({ date: -1, category: 1 });
export default mongoose.model("Expense", expenseSchema);
