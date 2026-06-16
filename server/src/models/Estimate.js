import mongoose from "mongoose";

const lineSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, min: 0, default: 1 },
    price: { type: Number, min: 0, default: 0 },
  },
  { _id: false },
);

const estimateSchema = new mongoose.Schema(
  {
    estimateNumber: { type: String, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "approved", "rejected", "converted"],
      default: "draft",
    },
    services: { type: [lineSchema], default: [] },
    labor: { type: Number, min: 0, default: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    notes: { type: String, trim: true },
    validUntil: Date,
    convertedWorkOrder: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder" },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

estimateSchema.virtual("subtotal").get(function subtotal() {
  const services = Array.isArray(this.services) ? this.services : [];
  return services.reduce(
    (sum, item) => sum + Number(item?.quantity || 0) * Number(item?.price || 0),
    0,
  ) + Number(this.labor || 0);
});

estimateSchema.virtual("total").get(function total() {
  return this.subtotal * (1 + Number(this.taxRate || 0) / 100);
});

estimateSchema.pre("validate", async function assignEstimateNumber(next) {
  if (this.estimateNumber) return next();
  const latest = await this.constructor.findOne({}, { estimateNumber: 1 }).sort({ createdAt: -1 });
  const previous = Number(latest?.estimateNumber?.replace(/\D/g, "")) || 0;
  this.estimateNumber = `EST-${String(previous + 1).padStart(5, "0")}`;
  next();
});

export default mongoose.model("Estimate", estimateSchema);
