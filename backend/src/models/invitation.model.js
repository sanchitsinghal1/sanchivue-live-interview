// src/models/invitation.model.js
// Used for two flows:
//   1) Inviting a team member to an organization.
//   2) Inviting a candidate to a specific interview.
// The token is a high-entropy random hex string — never reuse JWT for this.
import mongoose from 'mongoose';
import crypto from 'node:crypto';

const invitationSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    // Optional link to a specific interview (candidate invitations).
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null,
      index: true,
    },
    // Email the invite was sent to. May not yet have an account.
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    // The role the invitee will receive on acceptance.
    role: { type: String, required: true },
    // High-entropy URL-safe token. Set in pre-validate so callers don't have to.
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED'],
      default: 'PENDING',
      index: true,
    },
    expiresAt: {
      type: Date,
      // Default 7-day TTL — Mongo's TTL index (below) will delete the row.
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

// TTL index: MongoDB auto-deletes rows after expiresAt.
invitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
