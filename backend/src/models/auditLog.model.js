// src/models/auditLog.model.js
// Append-only audit trail. Every sensitive action (login, role change, interview
// state transition, etc.) writes a row here so admins can reconstruct activity.
// TTL on createdAt so the table self-prunes after 1 year.
import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true, index: true }, // e.g. USER_LOGIN, INTERVIEW_END
    source: { type: String, default: 'Sanchivue' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    targetType: { type: String, default: null }, // e.g. 'Interview', 'User'
    targetId: { type: mongoose.Schema.Types.ObjectId, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false, capped: { size: 50 * 1024 * 1024, max: 100000 } },
);

// TTL — Mongo deletes rows 365 days after createdAt.
// (Don't add `index: true` above to avoid a duplicate-index warning.)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
