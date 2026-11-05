// src/models/aiInteraction.model.js
// Every call to the AI service is logged here so we can audit prompts / responses
// and re-train heuristics later. Not exposed via API to candidates.
import mongoose from 'mongoose';

const aiInteractionSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // copilot | assessment | summary | followups
    kind: { type: String, required: true, enum: ['copilot', 'assessment', 'summary', 'followups'] },
    prompt: { type: String, default: '' },
    response: { type: String, default: '' },
    model: { type: String, default: 'local-fallback' },
    durationMs: { type: Number, default: 0 },
    success: { type: Boolean, default: true },
    // TTL — keep AI logs for 90 days, then auto-prune.
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true },
);

aiInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiInteractionSchema.index({ userId: 1, kind: 1, createdAt: -1 });

const AIInteraction = mongoose.model('AIInteraction', aiInteractionSchema);
export default AIInteraction;
