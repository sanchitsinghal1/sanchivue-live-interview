// src/models/notification.model.js
// In-app notifications. We keep them short-lived (TTL via createdAt) so the
// collection doesn't grow forever. Push delivery is a separate concern handled
// by the email service.
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true }, // e.g. INTERVIEW_SCHEDULED, INVITE_RECEIVED
    title: { type: String, required: true },
    body: { type: String, default: '' },
    read: { type: Boolean, default: false, index: true },
    // Arbitrary JSON payload (e.g. interviewId, orgId, action URL).
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Auto-delete after 30 days to keep the collection lean.
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
