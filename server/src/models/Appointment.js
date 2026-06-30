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
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export default mongoose.model("Appointment", appointmentSchema);
