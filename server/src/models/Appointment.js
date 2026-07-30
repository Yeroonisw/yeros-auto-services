import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
    title: { type: String, required: true, trim: true },
    serviceType: { type: String, trim: true, default: "General service" },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"],
      default: "scheduled",
    },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, min: 15, default: 60 },
    location: { type: String, trim: true },
    mechanic: { type: String, trim: true, default: "Yero" },
    mechanicStatus: {
      type: String,
      enum: ["available", "traveling", "working", "break", "off"],
      default: "available",
    },
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

appointmentSchema.index({ scheduledAt: 1, status: 1 });
appointmentSchema.index({ mechanic: 1, scheduledAt: 1 });
export default mongoose.model("Appointment", appointmentSchema);
