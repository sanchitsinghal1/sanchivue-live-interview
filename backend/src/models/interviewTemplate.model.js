// src/models/interviewTemplate.model.js
// Reusable interview config — a curated set of questions + rubric that a recruiter
// can apply to a new interview in one click.
import mongoose from 'mongoose';

const rubricTemplateSchema = new mongoose.Schema(
  {
    problemSolving: { type: Number, default: 5, min: 0, max: 10 },
    correctness: { type: Number, default: 5, min: 0, max: 10 },
    codeQuality: { type: Number, default: 5, min: 0, max: 10 },
    communication: { type: Number, default: 5, min: 0, max: 10 },
    debugging: { type: Number, default: 5, min: 0, max: 10 },
    testing: { type: Number, default: 5, min: 0, max: 10 },
    design: { type: Number, default: 5, min: 0, max: 10 },
    complexity: { type: Number, default: 5, min: 0, max: 10 },
  },
  { _id: false },
);

const interviewTemplateSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '' },
    // Snapshots of question IDs at template-creation time (so future question edits
    // don't silently change what the template tests).
    questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    jobRole: { type: String, default: '' },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    type: {
      type: String,
      enum: ['CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'MIXED'],
      default: 'CODING',
    },
    durationMin: { type: Number, default: 60 },
    rubric: { type: rubricTemplateSchema, default: () => ({}) },
    allowedLanguages: { type: [String], default: ['javascript'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

const InterviewTemplate = mongoose.model('InterviewTemplate', interviewTemplateSchema);
export default InterviewTemplate;
