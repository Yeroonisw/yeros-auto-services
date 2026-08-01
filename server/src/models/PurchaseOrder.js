import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  part: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
  name: { type: String, required: true, trim: true },
  sku: { type: String, trim: true },
  quantity: { type: Number, min: 1, required: true },
  received: { type: Number, min: 0, default: 0 },
  cost: { type: Number, min: 0, default: 0 },
}, { _id: true });

const schema = new mongoose.Schema({
  purchaseOrderNumber: { type: String, unique: true, index: true },
  supplier: { type: String, required: true, trim: true, index: true },
  supplierPhone: { type: String, trim: true },
  status: { type: String, enum: ["draft", "ordered", "partial", "received", "cancelled"], default: "draft", index: true },
  expectedAt: Date,
  items: { type: [itemSchema], default: [] },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

schema.virtual("total").get(function total() { return this.items.reduce((sum, item) => sum + item.quantity * item.cost, 0); });
schema.pre("validate", async function assignNumber(next) {
  if (this.purchaseOrderNumber) return next();
  const latest = await this.constructor.findOne({}, { purchaseOrderNumber: 1 }).sort({ createdAt: -1 });
  const previous = Number(latest?.purchaseOrderNumber?.replace(/\D/g, "")) || 0;
  this.purchaseOrderNumber = `PO-${String(previous + 1).padStart(5, "0")}`;
  next();
});

export default mongoose.model("PurchaseOrder", schema);
