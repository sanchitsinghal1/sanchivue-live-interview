// src/utils/auditLogger.js
// Writes an AuditLog row describing an action taken by an actor against a target.
// Used by sensitive endpoints (auth, org, interview state changes) so admins can
// reconstruct "who did what". Best-effort: never lets an audit failure break a
// request — we swallow the error and just log.
import AuditLog from '../models/auditLog.model.js';
import { getDbState } from '../db/index.js';
import { AUDIT_SOURCE } from '../config/constants.js';

export async function auditLogger({ action, actor = null, target = {}, meta = {}, ip = null }) {
  // Don't bother hitting mongoose if DB is down — avoids blocking the request.
  if (getDbState() !== 'connected') return;
  try {
    await AuditLog.create({
      action,
      source: AUDIT_SOURCE,
      actorId: actor?._id || actor || null,
      targetType: target.type || null,
      targetId: target.id || null,
      meta,
      ip,
    });
  } catch (err) {
    console.error('[auditLogger] failed to persist audit log:', err.message);
  }
}

export default auditLogger;
