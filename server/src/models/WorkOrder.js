import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 0, default: 1 },
    price: { type: Number, min: 0, default: 0 },
    cost: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const dtcSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, trim: true },
    status: { type: String, enum: ["active", "pending", "history"], default: "active" },
  },
  { _id: false },
);

const workOrderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending",
    },
    services: { type: [serviceSchema], default: [] },
    dtcCodes: { type: [dtcSchema], default: [] },
    labor: { type: Number, min: 0, default: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    paymentMethod: { type: String, trim: true, default: "Pending" },
    notes: { type: String, trim: true },
    openedAt: { type: Date, default: Date.now },
    completedAt: Date,
    sourceEstimate: { type: mongoose.Schema.Types.ObjectId, ref: "Estimate" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

workOrderSchema.virtual("subtotal").get(function subtotal() {
  const services = Array.isArray(this.services) ? this.services : [];
  return services.reduce(
    (sum, item) => sum + Number(item?.quantity || 0) * Number(item?.price || 0),
    0,
  ) + Number(this.labor || 0);
});

workOrderSchema.virtual("total").get(function total() {
  return this.subtotal * (1 + Number(this.taxRate || 0) / 100);
});

workOrderSchema.virtual("partsCost").get(function partsCost() {
  const services = Array.isArray(this.services) ? this.services : [];
  return services.reduce(
    (sum, item) => sum + Number(item?.quantity || 0) * Number(item?.cost || 0),
    0,
  );
});

workOrderSchema.virtual("grossProfit").get(function grossProfit() {
  return this.subtotal - this.partsCost;
});

workOrderSchema.pre("validate", async function assignOrderNumber(next) {
  if (this.orderNumber) return next();
  const latest = await this.constructor.findOne({}, { orderNumber: 1 }).sort({ createdAt: -1 });
  const previous = Number(latest?.orderNumber?.replace(/\D/g, "")) || 0;
  this.orderNumber = `WO-${String(previous + 1).padStart(5, "0")}`;
  next();
});

export default mongoose.model("WorkOrder", workOrderSchema);
