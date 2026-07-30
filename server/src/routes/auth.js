import express from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import LoginAttempt from "../models/LoginAttempt.js";
import { verifyTotp } from "../services/totp.js";

const router = express.Router();
const recoveryAttempts = new Map();

function safeEqual(left, right) {
  const leftHash = crypto.createHash("sha256").update(String(left)).digest();
  const rightHash = crypto.createHash("sha256").update(String(right)).digest();
  return crypto.timingSafeEqual(leftHash, rightHash);
}

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const ipHash = crypto.createHash("sha256").update(String(req.ip || "") + String(process.env.JWT_SECRET)).digest("hex").slice(0, 16);
    const recentFailures = await LoginAttempt.countDocuments({ email, success: false, createdAt: { $gte: new Date(Date.now() - 15 * 60000) } });
    if (recentFailures >= 8) return res.status(429).json({ message: "Too many sign-in attempts. Try again in 15 minutes." });
    const user = await User.findOne({ email }).select("+password +twoFactorSecret");

    if (!user || user.active === false || !(await user.matchesPassword(password))) {
      await LoginAttempt.create({ email, success: false, ipHash, userAgent: req.get("user-agent"), reason: "invalid_credentials" });
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (user.twoFactorEnabled && !verifyTotp(user.twoFactorSecret, req.body.otp)) {
      await LoginAttempt.create({ email, success: false, ipHash, userAgent: req.get("user-agent"), reason: "invalid_otp" });
      return res.status(401).json({ message: req.body.otp ? "Invalid authentication code" : "Authentication code required", requiresTwoFactor: true });
    }

    user.lastLoginAt = new Date();
    await user.save();
    await LoginAttempt.create({ email, success: true, ipHash, userAgent: req.get("user-agent"), reason: "success" });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "8h",
    });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions || [] },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    user: { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, permissions: req.user.permissions || [] },
  });
});

router.post("/recover", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const recoveryCode = String(req.body.recoveryCode || "");
    const newPassword = String(req.body.newPassword || "");
    const configuredCode = process.env.ADMIN_RECOVERY_CODE;
    if (!configuredCode) return res.status(503).json({ message: "Recovery is not configured. Contact the system administrator." });
    const attempt = recoveryAttempts.get(email) || { count: 0, at: Date.now() };
    if (Date.now() - attempt.at > 15 * 60000) { attempt.count = 0; attempt.at = Date.now(); }
    if (attempt.count >= 5) return res.status(429).json({ message: "Too many recovery attempts. Try again in 15 minutes." });
    attempt.count += 1; recoveryAttempts.set(email, attempt);
    if (!safeEqual(recoveryCode, configuredCode)) return res.status(400).json({ message: "Invalid recovery information" });
    if (newPassword.length < 8) return res.status(400).json({ message: "New password must contain at least 8 characters" });
    const user = await User.findOne({ email }).select("+password");
    if (!user || user.role !== "admin") return res.status(400).json({ message: "Invalid recovery information" });
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    recoveryAttempts.delete(email);
    res.json({ message: "Access recovered. You can sign in with the new password." });
  } catch (error) {
    next(error);
  }
});

export default router;
