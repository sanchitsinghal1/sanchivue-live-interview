// src/models/evaluation.model.js
// Post-interview evaluation — rubric scores + AI summary + interviewer notes +
// final hiring recommendation. One per interview (enforced by unique index).
import mongoose from 'mongoose';
import { RECOMMENDATION } from '../config/constants.js';

const rubricScoresSchema = new mongoose.Schema(
  {
    problemSolving: { type: Number, default: 0, min: 0, max: 10 },
    correctness: { type: Number, default: 0, min: 0, max: 10 },
    codeQuality: { type: Number, default: 0, min: 0, max: 10 },
    communication: { type: Number, default: 0, min: 0, max: 10 },
    debugging: { type: Number, default: 0, min: 0, max: 10 },
    testing: { type: Number, default: 0, min: 0, max: 10 },
    design: { type: Number, default: 0, min: 0, max: 10 },
    complexity: { type: Number, default: 0, min: 0, max: 10 },
  },
  { _id: false },
);

const evaluationSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      unique: true,
      index: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rubricScores: { type: rubricScoresSchema, default: () => ({}) },
    aiSummary: { type: String, default: '' },
    aiStrengths: { type: [String], default: [] },
    aiConcerns: { type: [String], default: [] },
    interviewerNotes: { type: String, default: '' },
    recommendation: {
      type: String,
      enum: Object.values(RECOMMENDATION),
      default: RECOMMENDATION.PENDING,
      index: true,
    },
    // Submitted score (0-100) computed from rubric + pass rate.
    finalScore: { type: Number, default: 0, min: 0, max: 100 },
    // Optional: AI model used to generate aiSummary.
    aiModel: { type: String, default: '' },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

evaluationSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);
export default Evaluation;
