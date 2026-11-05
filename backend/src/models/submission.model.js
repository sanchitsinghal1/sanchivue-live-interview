// src/models/submission.model.js
// A run/submit attempt for a candidate's code against a question's tests.
// We store the code, language, verdicts, and metrics so the candidate can
// review their history and the interviewer can replay the session.
import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { SUBMISSION_STATUS, SUBMISSION_STATUS_VALUES } from '../config/constants.js';

const perTestResultSchema = new mongoose.Schema(
  {
    passed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: SUBMISSION_STATUS_VALUES,
      default: SUBMISSION_STATUS.PENDING,
    },
    isHidden: { type: Boolean, default: false },
    input: { type: String, default: '' },
    expected: { type: String, default: '' },
    actual: { type: String, default: '' },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      default: null,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    code: { type: String, required: true },
    language: { type: String, required: true, default: 'javascript' },
    status: {
      type: String,
      enum: SUBMISSION_STATUS_VALUES,
      default: SUBMISSION_STATUS.PENDING,
      index: true,
    },
    passedCount: { type: Number, default: 0 },
    totalCount: { type: Number, default: 0 },
    score: { type: Number, default: 0, min: 0, max: 100 },
    executionTimeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    stdout: { type: String, default: '' },
    stderr: { type: String, default: '' },
    results: { type: [perTestResultSchema], default: [] },
    // "run" (public only) vs "submit" (public + hidden, scored)
    kind: { type: String, enum: ['run', 'submit'], default: 'submit' },
  },
  { timestamps: true },
);

// Candidate history lookup.
submissionSchema.index({ candidateId: 1, questionId: 1, createdAt: -1 });
submissionSchema.index({ interviewId: 1, createdAt: -1 });

submissionSchema.plugin(mongooseAggregatePaginate);

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
