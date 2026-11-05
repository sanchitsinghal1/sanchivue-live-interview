// src/models/question.model.js
// DSA problem bank. Each question is org-scoped (so orgs can have private
// question banks). `publicTests` are visible to candidates; `hiddenTests` are
// server-side only — NEVER sent to the client in their raw form.
import mongoose from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { DIFFICULTY_VALUES, SUPPORTED_LANGUAGES } from '../config/constants.js';
import { DEFAULT_TIME_LIMIT_MS, DEFAULT_MEMORY_LIMIT_MB } from '../config/constants.js';

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true }, // JSON-serialized args array
    expectedOutput: { type: String, required: true }, // JSON-serialized expected value
    explanation: { type: String, default: '' },
    weight: { type: Number, default: 1, min: 0 },
  },
  { _id: false },
);

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false },
);

const starterCodeSchema = new mongoose.Schema(
  {
    javascript: { type: String, default: '' },
    python: { type: String, default: '' },
    java: { type: String, default: '' },
    cpp: { type: String, default: '' },
  },
  { _id: false },
);

const questionSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, trim: true, lowercase: true, index: true },
    difficulty: { type: String, enum: DIFFICULTY_VALUES, default: 'Easy' },
    tags: { type: [String], default: [] },
    statement: { type: String, required: true },
    constraints: { type: String, default: '' },
    examples: { type: [exampleSchema], default: [] },
    starterCode: { type: starterCodeSchema, default: () => ({}) },
    publicTests: { type: [testCaseSchema], default: [] },
    hiddenTests: { type: [testCaseSchema], default: [] },
    optimalTime: { type: String, default: '' }, // e.g. "O(N)"
    optimalSpace: { type: String, default: '' }, // e.g. "O(N)"
    // Progressive hints shown to candidates (NOT secret — visible to candidates
    // who want a nudge). Default empty so existing questions behave as before.
    hints: { type: [String], default: [] },
    timeLimitMs: { type: Number, default: DEFAULT_TIME_LIMIT_MS },
    memoryLimitMb: { type: Number, default: DEFAULT_MEMORY_LIMIT_MB },
    allowedLanguages: { type: [String], enum: SUPPORTED_LANGUAGES, default: ['javascript'] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isArchived: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Unique per org — same slug can exist in different orgs.
questionSchema.index({ orgId: 1, slug: 1 }, { unique: true });
// For tag-filtered listings.
questionSchema.index({ orgId: 1, tags: 1 });
// For text-ish search via title.
questionSchema.index({ orgId: 1, title: 'text' });

questionSchema.plugin(mongooseAggregatePaginate);

questionSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
