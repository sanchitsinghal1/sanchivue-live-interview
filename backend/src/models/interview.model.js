// src/models/interview.model.js
// The central resource — a single interview session. Embeds proctoring/chat/
// snapshots as JSON arrays (capped on write to avoid runaway doc growth).
// The roomCode is the unique join identifier the Socket.io clients use.
import mongoose from 'mongoose';
import { INTERVIEW_STATUS_VALUES, INTERVIEW_STATUS } from '../config/constants.js';
import { SUPPORTED_LANGUAGES } from '../config/constants.js';

const proctoringLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['tab-switch', 'window-blur', 'paste-anomaly', 'fullscreen-exit', 'idle'],
    },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    detail: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: false },
);

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: '' },
    role: { type: String, default: '' },
    body: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const snapshotSchema = new mongoose.Schema(
  {
    code: { type: String, default: '' },
    language: { type: String, default: 'javascript' },
    eventType: { type: String, enum: ['auto', 'run', 'submit'], default: 'auto' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
);

const interviewSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    jobRole: { type: String, default: '', trim: true, maxlength: 120 },
    candidateUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    candidateEmail: { type: String, default: '' }, // for invite-only candidates without an account
    candidateName: { type: String, default: '' },
    interviewerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InterviewTemplate',
      default: null,
    },
    status: {
      type: String,
      enum: INTERVIEW_STATUS_VALUES,
      default: INTERVIEW_STATUS.DRAFT,
      index: true,
    },
    type: {
      type: String,
      enum: ['CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'MIXED'],
      default: 'CODING',
    },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    scheduledAt: { type: Date, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    durationMin: { type: Number, default: 60 },
    timezone: { type: String, default: 'UTC' },
    allowedLanguages: { type: [String], enum: SUPPORTED_LANGUAGES, default: ['javascript'] },
    aiPolicy: {
      type: String,
      enum: ['allowed', 'hint-only', 'disabled'],
      default: 'allowed',
    },
    instructions: { type: String, default: '' },
    // Pre-session rubric draft (interviewer edits live during the session).
    rubricDraft: {
      problemSolving: { type: Number, default: 0, min: 0, max: 10 },
      correctness: { type: Number, default: 0, min: 0, max: 10 },
      codeQuality: { type: Number, default: 0, min: 0, max: 10 },
      communication: { type: Number, default: 0, min: 0, max: 10 },
      debugging: { type: Number, default: 0, min: 0, max: 10 },
      testing: { type: Number, default: 0, min: 0, max: 10 },
      design: { type: Number, default: 0, min: 0, max: 10 },
      complexity: { type: Number, default: 0, min: 0, max: 10 },
    },
    // Unique, shareable code the candidate uses to join the room.
    roomCode: { type: String, required: true, unique: true, index: true },
    // Embedded arrays — capped on write via the controller.
    proctoringLogs: { type: [proctoringLogSchema], default: [] },
    chatLog: { type: [chatMessageSchema], default: [] },
    snapshots: { type: [snapshotSchema], default: [] },
  },
  { timestamps: true },
);

// Compound index for dashboard listings: "my upcoming interviews".
interviewSchema.index({ orgId: 1, status: 1, scheduledAt: 1 });
// For the candidate's history listing.
interviewSchema.index({ candidateUserId: 1, status: 1 });
// For interviewer calendar.
interviewSchema.index({ interviewerIds: 1, status: 1 });

interviewSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
