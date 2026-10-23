// src/services/audit.service.js
// Thin wrapper around the auditLogger util. We expose a service-level API so
// controllers can log structured events without knowing about the model layer.
import auditLogger from '../utils/auditLogger.js';

// Convenience methods for the most common audit actions.
export const AuditService = {
  log({ action, actor = null, target = {}, meta = {}, ip = null }) {
    return auditLogger({ action, actor, target, meta, ip });
  },
  userLogin(user, ip) {
    return auditLogger({
      action: 'USER_LOGIN',
      actor: user,
      target: { type: 'User', id: user?._id },
      meta: {},
      ip,
    });
  },
  userLogout(user, ip) {
    return auditLogger({
      action: 'USER_LOGOUT',
      actor: user,
      target: { type: 'User', id: user?._id },
      meta: {},
      ip,
    });
  },
  interviewStateChange(user, interview, fromStatus, toStatus, ip) {
    return auditLogger({
      action: 'INTERVIEW_STATE_CHANGE',
      actor: user,
      target: { type: 'Interview', id: interview?._id },
      meta: { fromStatus, toStatus, roomCode: interview?.roomCode },
      ip,
    });
  },
  orgInvite(user, orgId, email, role, ip) {
    return auditLogger({
      action: 'ORG_INVITE',
      actor: user,
      target: { type: 'Organization', id: orgId },
      meta: { email, role },
      ip,
    });
  },
};

export default AuditService;
