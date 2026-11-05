// src/controllers/question.controller.js
// Question bank CRUD + aggregate-paginated list with search/filter + AI generate.
import Question from '../models/question.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aggregatePaginate } from '../utils/aggregationPagination.js';
import { getPagination } from '../utils/pagination.js';
import { generateAssessmentFromJD, generateQuestion } from '../services/ai.service.js';

// POST /api/v1/questions
export const createQuestion = asyncHandler(async (req, res) => {
  const orgId = req.body.orgId || req.orgId;
  if (!orgId) throw new ApiError(400, 'orgId is required.');
  const payload = { ...req.body, orgId, createdBy: req.user._id };
  const question = await Question.create(payload);
  return res.status(201).json(new ApiResponse(201, { question }, 'Question created'));
});

// GET /api/v1/questions — aggregate-paginated list with search/difficulty/tag filter.
// Hidden tests are NEVER returned to the client (we strip them below).
export const listQuestions = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req);
  const orgId = req.query.orgId || req.orgId;
  const pipeline = [];
  const matchStage = {};
  if (orgId) matchStage.orgId = orgId;
  if (req.query.difficulty) matchStage.difficulty = req.query.difficulty;
  if (req.query.tag) matchStage.tags = { $in: [req.query.tag] };
  if (req.query.q) {
    matchStage.$text = { $search: req.query.q };
  }
  if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage });
  pipeline.push({ $sort: { createdAt: -1 } });
  // Strip hidden tests before returning to the client.
  pipeline.push({
    $project: {
      title: 1,
      slug: 1,
      difficulty: 1,
      tags: 1,
      statement: 1,
      constraints: 1,
      examples: 1,
      starterCode: 1,
      publicTests: 1,
      optimalTime: 1,
      optimalSpace: 1,
      timeLimitMs: 1,
      memoryLimitMb: 1,
      allowedLanguages: 1,
      hints: 1,
      createdBy: 1,
      orgId: 1,
      createdAt: 1,
      updatedAt: 1,
      // Intentionally omit hiddenTests.
    },
  });
  const result = await aggregatePaginate(Question, pipeline, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Questions'));
});

// GET /api/v1/questions/:id
export const getQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).lean();
  if (!question) throw new ApiError(404, 'Question not found.');
  // Strip hidden tests — interviewers get them via a separate admin route.
  const { hiddenTests: _hidden, ...safe } = question;
  return res.status(200).json(new ApiResponse(200, { question: safe }, 'Question'));
});

// GET /api/v1/questions/:id/admin — interviewer+ view including hidden tests.
export const getQuestionAdmin = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).lean();
  if (!question) throw new ApiError(404, 'Question not found.');
  return res.status(200).json(new ApiResponse(200, { question }, 'Question (admin)'));
});

// PATCH /api/v1/questions/:id
export const updateQuestion = asyncHandler(async (req, res) => {
  const update = {};
  const allowed = [
    'title',
    'slug',
    'difficulty',
    'tags',
    'statement',
    'constraints',
    'examples',
    'starterCode',
    'publicTests',
    'hiddenTests',
    'optimalTime',
    'optimalSpace',
    'timeLimitMs',
    'memoryLimitMb',
    'allowedLanguages',
    'isArchived',
    'hints',
  ];
  for (const k of allowed) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }
  const question = await Question.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!question) throw new ApiError(404, 'Question not found.');
  return res.status(200).json(new ApiResponse(200, { question }, 'Question updated'));
});

// DELETE /api/v1/questions/:id — soft delete (archive).
export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { $set: { isArchived: true } },
    { new: true },
  );
  if (!question) throw new ApiError(404, 'Question not found.');
  return res.status(200).json(new ApiResponse(200, { question }, 'Question archived'));
});

// POST /api/v1/questions/ai-generate-question — single-question AI generator.
// Returns a question preview (NOT persisted) matching the Question schema.
// The user reviews the preview in the editor and clicks Save, which calls the
// normal createQuestion. The `aiLimiter` rate-limit is applied at the route
// layer (see question.routes.js) so this controller can assume the request is
// under the per-window cap.
export const aiGenerateQuestion = asyncHandler(async (req, res) => {
  const { topic, difficulty, type } = req.body || {};
  if (!topic || typeof topic !== 'string' || topic.trim().length < 2) {
    throw new ApiError(400, 'topic is required (min 2 chars).');
  }
  const orgId = req.body.orgId || req.orgId;
  // We don't strictly require an orgId to GENERATE (the AI doesn't need it),
  // but we DO need it to dedupe the slug against the org. If absent, we skip
  // the duplicate check — the controller just returns the slug as-is and the
  // createQuestion endpoint will reject on save if it collides.
  const question = await generateQuestion(
    { topic: topic.trim(), difficulty, type },
    { userId: req.user._id, orgId },
  );
  // Duplicate detection: if the slug is taken in this org, append a short
  // random suffix so the user can save without a conflict.
  if (orgId && question.slug) {
    const exists = await Question.exists({ orgId, slug: question.slug });
    if (exists) {
      const suffix = Math.random().toString(36).slice(2, 6);
      question.slug = `${question.slug}-${suffix}`.slice(0, 80);
    }
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { question }, 'AI-generated question preview'));
});

// POST /api/v1/questions/ai-generate — JD → blueprint (preview; doesn't persist).
export const aiGenerateFromJD = asyncHandler(async (req, res) => {
  const { jd } = req.body;
  if (!jd || jd.length < 10) throw new ApiError(400, 'jd is required (min 10 chars).');
  const blueprint = await generateAssessmentFromJD(jd, { userId: req.user._id, orgId: req.orgId });
  return res.status(200).json(new ApiResponse(200, { blueprint }, 'AI-generated blueprint'));
});
