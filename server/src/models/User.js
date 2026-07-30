import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: ["admin", "manager", "technician"], default: "admin" },
    active: { type: Boolean, default: true },
    permissions: {
      type: [String],
      default: ["dashboard", "customers", "vehicles", "appointments", "work_orders", "estimates", "inventory", "reminders", "inspections", "finance", "technicians"],
    },
    lastLoginAt: Date,
    passwordChangedAt: Date,
    hourlyRate: { type: Number, min: 0, default: 0 },
    commissionRate: { type: Number, min: 0, max: 100, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchesPassword = function matchesPassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
