// src/controllers/submission.controller.js
// Run / submit endpoints. Both go through the same code execution engine;
// "run" only executes public tests, "submit" queues the job and scores it.
import Submission from '../models/submission.model.js';
import Question from '../models/question.model.js';
import Interview from '../models/interview.model.js';
import { runCode } from '../services/codeExecution.service.js';
import { submissionQueue } from '../queues/submissionQueue.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aggregatePaginate } from '../utils/aggregationPagination.js';
import { getPagination } from '../utils/pagination.js';
import { SUBMISSION_STATUS } from '../config/constants.js';

// POST /api/v1/submissions/run — execute candidate code against public tests ONLY.
// Synchronous — no queue. Returns per-case results immediately.
export const runCodeHandler = asyncHandler(async (req, res) => {
  const { questionId, language, code, timeLimitMs, memoryLimitMb } = req.body;
  const question = await Question.findById(questionId).lean();
  if (!question) throw new ApiError(404, 'Question not found.');

  // Run only public tests. Hidden tests never run during the "Run Code" flow.
  const publicTests = (question.publicTests || []).map((t) => ({ ...t, isHidden: false }));
  const result = runCode(
    language,
    code,
    publicTests,
    timeLimitMs || question.timeLimitMs,
    memoryLimitMb || question.memoryLimitMb,
  );
  // Persist as a `run` submission (no scoring impact).
  const submission = await Submission.create({
    orgId: question.orgId,
    candidateId: req.user._id,
    interviewId: req.body.interviewId || null,
    questionId: question._id,
    code,
    language,
    kind: 'run',
    status: result.overallStatus,
    passedCount: result.passedCount,
    totalCount: result.totalCount,
    executionTimeMs: result.executionTimeMs,
    memoryKb: result.memoryKb,
    stdout: (result.stdout || '').slice(0, 50_000),
    stderr: (result.stderr || '').slice(0, 50_000),
    results: result.results,
  });
  return res.status(200).json(new ApiResponse(200, { submission, result }, 'Run complete'));
});

// POST /api/v1/submissions/submit — queue a scored submission (public + hidden).
// Returns immediately with a PENDING submission; the worker fills in results.
export const submitCodeHandler = asyncHandler(async (req, res) => {
  const { questionId, language, code, interviewId } = req.body;
  const question = await Question.findById(questionId).lean();
  if (!question) throw new ApiError(404, 'Question not found.');

  const submission = await Submission.create({
    orgId: question.orgId,
    candidateId: req.user._id,
    interviewId: interviewId || null,
    questionId: question._id,
    code,
    language,
    kind: 'submit',
    status: SUBMISSION_STATUS.PENDING,
  });

  // Enqueue for the worker to evaluate.
  await submissionQueue.enqueue({ submissionId: submission._id.toString() });

  return res
    .status(202)
    .json(
      new ApiResponse(
        202,
        { submissionId: submission._id, status: 'PENDING' },
        'Submission queued',
      ),
    );
});

// GET /api/v1/submissions/:id — fetch a single submission (incl. worker results).
// We strip hidden-test inputs/expected/actual from the result set so a candidate
// GET never sees the test definitions. (The worker already does this when persisting;
// we strip again here as defense-in-depth.)
export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await Submission.findById(req.params.id).lean();
  if (!submission) throw new ApiError(404, 'Submission not found.');
  // Authorization — only the candidate themselves OR an interviewer for that
  // interview OR a platform admin may view.
  const isOwner = String(submission.candidateId) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  let isInterviewer = false;
  if (submission.interviewId) {
    const interview = await Interview.findById(submission.interviewId)
      .select('interviewerIds')
      .lean();
    if (interview) {
      isInterviewer = interview.interviewerIds?.some((id) => String(id) === String(req.user._id));
    }
  }
  if (!isOwner && !isInterviewer && !isAdmin) {
    throw new ApiError(403, 'Not authorized to view this submission.');
  }
  // Mask hidden test details for non-interviewers / non-admins.
  const safeResults = (submission.results || []).map((r) => {
    if (r.isHidden && !isInterviewer && !isAdmin) {
      return {
        passed: r.passed,
        status: r.status,
        isHidden: true,
        // Drop the test definition entirely.
        input: '',
        expected: '',
        actual: '',
        stdout: '',
        stderr: '',
        executionTimeMs: r.executionTimeMs,
        memoryKb: r.memoryKb,
      };
    }
    return r;
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, { submission: { ...submission, results: safeResults } }, 'Submission'),
    );
});

// GET /api/v1/submissions/history — paginated list for the caller.
export const listSubmissions = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req);
  const pipeline = [];
  const matchStage = { candidateId: req.user._id };
  if (req.query.questionId) matchStage.questionId = req.query.questionId;
  if (req.query.interviewId) matchStage.interviewId = req.query.interviewId;
  if (req.query.status) matchStage.status = req.query.status;
  pipeline.push({ $match: matchStage });
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({
    $project: {
      code: 0, // Don't ship full code in the list view — keep payload small.
      stdout: 0,
      stderr: 0,
      results: 0,
    },
  });
  const result = await aggregatePaginate(Submission, pipeline, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Submissions'));
});
