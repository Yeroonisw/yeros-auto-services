import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["oil_change", "brakes", "appointment", "estimate", "invoice", "repair_follow_up", "custom"],
      required: true,
      index: true,
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    relatedModel: { type: String, enum: ["Appointment", "Estimate", "WorkOrder", "Vehicle", ""] },
    relatedId: mongoose.Schema.Types.ObjectId,
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    dueAt: { type: Date, required: true, index: true },
    status: { type: String, enum: ["pending", "sent", "dismissed"], default: "pending", index: true },
    sentAt: Date,
    channel: { type: String, enum: ["whatsapp", "phone", "email", "none"], default: "none" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

reminderSchema.index({ status: 1, dueAt: 1 });
export default mongoose.model("Reminder", reminderSchema);
