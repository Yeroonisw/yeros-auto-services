import mongoose from "mongoose";

const schema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true, trim: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
  discountValue: { type: Number, min: 0, required: true },
  startsAt: { type: Date, default: Date.now },
  expiresAt: Date,
  active: { type: Boolean, default: true, index: true },
  usageCount: { type: Number, min: 0, default: 0 },
}, { timestamps: true });

export default mongoose.model("Offer", schema);
