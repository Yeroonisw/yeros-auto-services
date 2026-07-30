import mongoose from "mongoose";

const partSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "General" },
    supplier: { type: String, trim: true },
    supplierPhone: { type: String, trim: true },
    quantity: { type: Number, min: 0, default: 0 },
    minimumStock: { type: Number, min: 0, default: 2 },
    cost: { type: Number, min: 0, default: 0 },
    salePrice: { type: Number, min: 0, default: 0 },
    location: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

partSchema.index({ name: "text", sku: "text", supplier: "text" });
partSchema.index({ quantity: 1, minimumStock: 1 });
partSchema.virtual("lowStock").get(function lowStock() {
  return this.quantity <= this.minimumStock;
});
partSchema.virtual("unitProfit").get(function unitProfit() {
  return Number(this.salePrice || 0) - Number(this.cost || 0);
});
partSchema.virtual("inventoryValue").get(function inventoryValue() {
  return Number(this.quantity || 0) * Number(this.cost || 0);
});

export default mongoose.model("Part", partSchema);
