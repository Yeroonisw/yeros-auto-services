import mongoose from "mongoose";

const interactionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    type: { type: String, enum: ["call", "whatsapp", "sms", "email", "note"], required: true },
    direction: { type: String, enum: ["outbound", "inbound", "internal"], default: "internal" },
    note: { type: String, required: true, trim: true },
    occurredAt: { type: Date, default: Date.now, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

interactionSchema.index({ customer: 1, occurredAt: -1 });
export default mongoose.model("CustomerInteraction", interactionSchema);
