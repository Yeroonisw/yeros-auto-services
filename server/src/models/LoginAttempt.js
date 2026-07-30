import mongoose from "mongoose";

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, lowercase: true, trim: true, index: true },
  success: { type: Boolean, default: false, index: true },
  ipHash: { type: String, trim: true },
  userAgent: { type: String, trim: true },
  reason: { type: String, trim: true },
}, { timestamps: true });

loginAttemptSchema.index({ createdAt: -1 });
loginAttemptSchema.index({ email: 1, createdAt: -1 });
export default mongoose.model("LoginAttempt", loginAttemptSchema);
