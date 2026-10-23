// src/models/testCase.model.js
// Standalone TestCase model — referenced from InterviewTemplate when a template
// needs to share test cases across questions. For ordinary question flows we use
// the embedded arrays on the Question model; this standalone model exists so
// templates can hold a richer test case object (e.g. graded weights, tags).
import mongoose from 'mongoose';

const testCaseModelSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
      index: true,
    },
    title: { type: String, default: '' },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    explanation: { type: String, default: '' },
    weight: { type: Number, default: 1, min: 0 },
    isHidden: { type: Boolean, default: true, index: true },
    isSample: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

testCaseModelSchema.index({ questionId: 1, isHidden: 1 });

const TestCase = mongoose.model('TestCase', testCaseModelSchema);
export default TestCase;
