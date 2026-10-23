// src/controllers/ai.controller.js
// AI endpoints: copilot (analyze code), assessment (JD→blueprint), summary
// (post-interview), followups. All rely on ai.service.js which has a deterministic
// local fallback so the buttons work even without an API key.
import {
  analyzeCandidateCode,
  generateAssessmentFromJD,
  generateEvaluationSummary,
  generateFollowupQuestions,
} from '../services/ai.service.js';
import Interview from '../models/interview.model.js';
import Submission from '../models/submission.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/v1/ai/copilot
// Body: { code, statement, interviewId? }
export const copilot = asyncHandler(async (req, res) => {
  const { code, statement, interviewId } = req.body;
  if (!code) throw new ApiError(400, 'code is required.');
  const result = await analyzeCandidateCode(code, statement, {
    userId: req.user._id,
    interviewId,
    orgId: req.orgId,
  });
  return res.status(200).json(new ApiResponse(200, { result }, 'AI co-pilot analysis'));
});

// POST /api/v1/ai/assessment
// Body: { jd }
export const assessment = asyncHandler(async (req, res) => {
  const { jd } = req.body;
  if (!jd || jd.length < 10) throw new ApiError(400, 'jd is required (min 10 chars).');
  const blueprint = await generateAssessmentFromJD(jd, {
    userId: req.user._id,
    orgId: req.orgId,
  });
  return res.status(200).json(new ApiResponse(200, { blueprint }, 'AI assessment blueprint'));
});

// POST /api/v1/ai/summary
// Body: { interviewId } — pulls rubricDraft + proctoring + recent submission pass ratio.
export const summary = asyncHandler(async (req, res) => {
  const { interviewId } = req.body;
  if (!interviewId) throw new ApiError(400, 'interviewId is required.');
  const interview = await Interview.findById(interviewId).lean();
  if (!interview) throw new ApiError(404, 'Interview not found.');
  // Compute pass ratio from recent submissions for this interview.
  const submissions = await Submission.find({ interviewId })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  const totals = submissions.reduce(
    (acc, s) => {
      acc.passed += s.passedCount || 0;
      acc.total += s.totalCount || 0;
      return acc;
    },
    { passed: 0, total: 0 },
  );
  const passedRatio = totals.total > 0 ? Math.round((totals.passed / totals.total) * 100) : 0;
  const result = await generateEvaluationSummary(
    {
      rubric: interview.rubricDraft || {},
      proctoringLogs: (interview.proctoringLogs || []).slice(-20),
      passedRatio,
      notes: '',
    },
    { userId: req.user._id, interviewId, orgId: interview.orgId },
  );
  return res.status(200).json(new ApiResponse(200, { result, passedRatio }, 'AI summary'));
});

// POST /api/v1/ai/followups
// Body: { topic }
export const followups = asyncHandler(async (req, res) => {
  const { topic } = req.body;
  const result = await generateFollowupQuestions(topic, {
    userId: req.user._id,
    orgId: req.orgId,
  });
  return res.status(200).json(new ApiResponse(200, { result }, 'AI follow-up questions'));
});
