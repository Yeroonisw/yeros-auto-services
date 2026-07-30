import mongoose from "mongoose";

const timeEntrySchema = new mongoose.Schema({
  technician: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  workOrder: { type: mongoose.Schema.Types.ObjectId, ref: "WorkOrder", required: true, index: true },
  clockIn: { type: Date, required: true, default: Date.now },
  clockOut: Date,
  minutes: { type: Number, min: 0, default: 0 },
  hourlyRate: { type: Number, min: 0, default: 0 },
  notes: { type: String, trim: true },
}, { timestamps: true });

timeEntrySchema.index({ technician: 1, clockIn: -1 });
export default mongoose.model("TimeEntry", timeEntrySchema);
