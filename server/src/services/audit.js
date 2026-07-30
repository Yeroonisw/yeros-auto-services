import AuditLog from "../models/AuditLog.js";

export async function recordAudit(req, action, entityType, entity, summary, metadata = {}) {
  try {
    await AuditLog.create({
      user: req.user?._id,
      userName: req.user?.name || req.user?.email || "System",
      action,
      entityType,
      entityId: String(entity?._id || entity || ""),
      summary,
      metadata,
    });
  } catch (error) {
    console.error("Audit log failed", error.message);
  }
}
