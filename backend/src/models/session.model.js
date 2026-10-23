// src/models/session.model.js
// Refresh session. Each login creates a row here so we can list/terminate
// active sessions and revoke on logout. TTL index auto-expires old rows.
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // SHA-256 hash of the raw refresh token (never the raw token itself).
    refreshTokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    revokedAt: { type: Date, default: null }, // set on logout
  },
  { timestamps: true },
);

// TTL index — Mongo auto-deletes after expiresAt elapses.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// For "list my sessions" lookup.
sessionSchema.index({ userId: 1, revokedAt: 1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
