// src/controllers/evaluation.controller.js
// Evaluation GET + upsert (rubric + AI summary).
import Evaluation from '../models/evaluation.model.js';
import Interview from '../models/interview.model.js';
import { generateEvaluationSummary } from '../services/ai.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { RECOMMENDATION, USER_ROLES } from '../config/constants.js';

// GET /api/v1/evaluations/:interviewId — fetch (or initialize) the evaluation.
export const getEvaluation = asyncHandler(async (req, res) => {
  const interviewId = req.params.interviewId;
  const interview = await Interview.findById(interviewId).lean();
  if (!interview) throw new ApiError(404, 'Interview not found.');
  // Authorization — participants only.
  const isCandidate = String(interview.candidateUserId) === String(req.user._id);
  const isInterviewer = interview.interviewerIds?.some((i) => String(i) === String(req.user._id));
  if (!isCandidate && !isInterviewer && req.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Not authorized.');
  }
  let evaluation = await Evaluation.findOne({ interviewId }).lean();
  if (!evaluation) {
    // Initialize an empty row so the client has a stable id to PUT against.
    evaluation = await Evaluation.create({
      interviewId,
      orgId: interview.orgId,
      candidateId: interview.candidateUserId,
      interviewerId: interview.interviewerIds?.[0] || req.user._id,
      rubricScores: interview.rubricDraft || {},
      recommendation: RECOMMENDATION.PENDING,
    });
    evaluation = evaluation.toObject();
  }
  // Candidates do NOT see interviewer notes / aiSummary until recommendation != PENDING.
  if (isCandidate && evaluation.recommendation === RECOMMENDATION.PENDING) {
    evaluation = {
      ...evaluation,
      aiSummary: '',
      aiStrengths: [],
      aiConcerns: [],
      interviewerNotes: '',
    };
  }
  return res.status(200).json(new ApiResponse(200, { evaluation }, 'Evaluation'));
});

// PUT /api/v1/evaluations/:interviewId — upsert rubric + AI summary.
export const upsertEvaluation = asyncHandler(async (req, res) => {
  const interviewId = req.params.interviewId;
  const interview = await Interview.findById(interviewId).lean();
  if (!interview) throw new ApiError(404, 'Interview not found.');
  const isInterviewer = interview.interviewerIds?.some((i) => String(i) === String(req.user._id));
  if (!isInterviewer && req.user.role !== USER_ROLES.ADMIN) {
    throw new ApiError(403, 'Only the interviewer may submit the evaluation.');
  }
  const rubricScores = req.body.rubricScores || {};
  const interviewerNotes = req.body.interviewerNotes ?? '';
  const passedRatio = Number(req.body.passedRatio ?? 0);

  // Generate the AI summary on save. Pulls recent proctoring alerts + notes.
  const summary = await generateEvaluationSummary(
    {
      rubric: rubricScores,
      proctoringLogs: (interview.proctoringLogs || []).slice(-20),
      passedRatio,
      notes: interviewerNotes,
    },
    { userId: req.user._id, interviewId, orgId: interview.orgId },
  );

  const update = {
    orgId: interview.orgId,
    candidateId: interview.candidateUserId,
    interviewerId: req.user._id,
    rubricScores,
    aiSummary: summary.summary,
    aiStrengths: summary.strengths,
    aiConcerns: summary.concerns,
    recommendation: summary.recommendation,
    finalScore: summary.finalScore,
    interviewerNotes,
    submittedAt: new Date(),
    aiModel: summary.model || 'local-fallback',
  };

  const evaluation = await Evaluation.findOneAndUpdate(
    { interviewId },
    { $set: update },
    { upsert: true, new: true },
  );
  return res.status(200).json(new ApiResponse(200, { evaluation }, 'Evaluation saved'));
});
