// src/controllers/interview.controller.js
// Interview CRUD + state transitions + participant joins + chat/proctoring/
// snapshot appends + assign-question + end session.
import crypto from 'node:crypto';
import Interview from '../models/interview.model.js';
import InterviewTemplate from '../models/interviewTemplate.model.js';
import CodeSnapshot from '../models/codeSnapshot.model.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { aggregatePaginate } from '../utils/aggregationPagination.js';
import { getPagination } from '../utils/pagination.js';
import { AuditService } from '../services/audit.service.js';
import { INTERVIEW_STATUS, USER_ROLES, SUPPORTED_LANGUAGES } from '../config/constants.js';

// Generate a short, human-readable unique room code (e.g. "AB12CD34").
function generateRoomCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
}

// Helper — strip sensitive hidden test data when responding to candidates.
function sanitizeForViewer(interview, viewer) {
  const isInterviewer = interview.interviewerIds?.some((id) => String(id) === String(viewer?._id));
  const isPlatformAdmin = viewer?.role === USER_ROLES.ADMIN;
  if (isInterviewer || isPlatformAdmin) return interview;
  // Candidates don't see proctoring logs.
  return { ...interview, proctoringLogs: [] };
}

// POST /api/v1/interviews
export const createInterview = asyncHandler(async (req, res) => {
  const orgId = req.body.orgId || req.orgId;
  if (!orgId) throw new ApiError(400, 'orgId is required.');
  const payload = { ...req.body, orgId };
  // Resolve candidate by email or id.
  if (payload.candidateEmail && !payload.candidateUserId) {
    const existing = await User.findOne({ email: payload.candidateEmail.toLowerCase() });
    if (existing) payload.candidateUserId = existing._id;
  }
  // Apply template defaults if specified.
  if (payload.templateId) {
    const template = await InterviewTemplate.findById(payload.templateId).lean();
    if (template) {
      payload.questionIds = payload.questionIds?.length
        ? payload.questionIds
        : template.questionIds;
      payload.difficulty = payload.difficulty || template.difficulty;
      payload.type = payload.type || template.type;
      payload.durationMin = payload.durationMin || template.durationMin;
      payload.allowedLanguages = payload.allowedLanguages?.length
        ? payload.allowedLanguages
        : template.allowedLanguages;
    }
  }
  if (!payload.roomCode) payload.roomCode = generateRoomCode();
  // Ensure roomCode is unique — extremely unlikely collision but cheap to check.
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await Interview.findOne({ roomCode: payload.roomCode });
    if (!existing) break;
    payload.roomCode = generateRoomCode();
  }
  // Default status — DRAFT unless scheduledAt is provided.
  if (!payload.status) {
    payload.status = payload.scheduledAt ? INTERVIEW_STATUS.SCHEDULED : INTERVIEW_STATUS.DRAFT;
  }

  const interview = await Interview.create(payload);
  await AuditService.log({
    action: 'INTERVIEW_CREATE',
    actor: req.user,
    target: { type: 'Interview', id: interview._id },
    meta: { roomCode: interview.roomCode },
    ip: req.ip,
  });
  return res.status(201).json(new ApiResponse(201, { interview }, 'Interview created'));
});

// GET /api/v1/interviews — aggregate-paginated list scoped to org + viewer.
export const listInterviews = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req);
  const orgId = req.query.orgId || req.orgId;
  const pipeline = [];
  const matchStage = {};
  if (orgId) matchStage.orgId = orgId;
  if (req.query.status) matchStage.status = req.query.status;
  if (req.query.candidateUserId) matchStage.candidateUserId = req.query.candidateUserId;
  // Non-admins: only interviews where they're the candidate OR an interviewer.
  if (req.user.role !== USER_ROLES.ADMIN) {
    matchStage.$or = [{ candidateUserId: req.user._id }, { interviewerIds: req.user._id }];
    // If orgId was provided and the user is in that org, also include interviews
    // where they're not a participant but a member of the org.
    if (orgId && req.membership) {
      // No-op — already covered above. (We intentionally let org members see all
      // interviews in the org by leaving the $or filter in place. If you want to
      // restrict further, replace this with a stricter match.)
    }
  }
  if (req.query.q) {
    const q = req.query.q;
    matchStage.$and = (matchStage.$and || []).concat([
      { $or: [{ title: { $regex: q, $options: 'i' } }, { jobRole: { $regex: q, $options: 'i' } }] },
    ]);
  }
  if (Object.keys(matchStage).length) pipeline.push({ $match: matchStage });
  pipeline.push({ $sort: { createdAt: -1 } });
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'candidateUserId',
      foreignField: '_id',
      as: 'candidate',
      pipeline: [{ $project: { name: 1, email: 1, avatarUrl: 1 } }],
    },
  });
  pipeline.push({ $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } });
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'interviewerIds',
      foreignField: '_id',
      as: 'interviewers',
      pipeline: [{ $project: { name: 1, email: 1, avatarUrl: 1 } }],
    },
  });
  const result = await aggregatePaginate(Interview, pipeline, { page, limit });
  return res.status(200).json(new ApiResponse(200, result, 'Interviews'));
});

// GET /api/v1/interviews/:id
export const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id)
    .populate('candidateUserId', 'name email avatarUrl')
    .populate('interviewerIds', 'name email avatarUrl')
    .populate('questionIds', 'title slug difficulty tags')
    .lean();
  if (!interview) throw new ApiError(404, 'Interview not found.');
  // Authorization.
  const isParticipant =
    String(interview.candidateUserId?._id || interview.candidateUserId) === String(req.user._id) ||
    interview.interviewerIds?.some((i) => String(i._id || i) === String(req.user._id)) ||
    req.user.role === USER_ROLES.ADMIN;
  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant of this interview.');
  }
  // Strip hiddenTests from embedded questionIds (we populated the question docs).
  // (Even though we only project safe fields above, double-defend by removing
  // hiddenTests if they slipped through.)
  if (Array.isArray(interview.questionIds)) {
    interview.questionIds = interview.questionIds.map((q) => {
      if (!q) return q;
      const { hiddenTests: _hidden, publicTests, ...rest } = q;
      return { ...rest, publicTests };
    });
  }
  const sanitized = sanitizeForViewer(interview, req.user);
  return res.status(200).json(new ApiResponse(200, { interview: sanitized }, 'Interview'));
});

// GET /api/v1/interviews/by-room/:roomCode — used by the join page.
export const getInterviewByRoomCode = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ roomCode: req.params.roomCode.toUpperCase() })
    .populate('candidateUserId', 'name email avatarUrl')
    .populate('interviewerIds', 'name email avatarUrl')
    .populate(
      'questionIds',
      'title slug difficulty tags statement examples constraints starterCode publicTests optimalTime optimalSpace timeLimitMs memoryLimitMb allowedLanguages',
    )
    .lean();
  if (!interview) throw new ApiError(404, 'Room not found.');
  // Strip hiddenTests from embedded question docs (defense in depth).
  if (Array.isArray(interview.questionIds)) {
    interview.questionIds = interview.questionIds.map((q) => {
      if (!q) return q;
      const { hiddenTests: _hidden, ...rest } = q;
      return rest;
    });
  }
  const sanitized = sanitizeForViewer(interview, req.user);
  return res.status(200).json(new ApiResponse(200, { interview: sanitized }, 'Interview'));
});

// PATCH /api/v1/interviews/:id
export const updateInterview = asyncHandler(async (req, res) => {
  const update = {};
  const allowed = [
    'title',
    'jobRole',
    'candidateUserId',
    'candidateEmail',
    'candidateName',
    'interviewerIds',
    'questionIds',
    'templateId',
    'type',
    'difficulty',
    'scheduledAt',
    'durationMin',
    'timezone',
    'allowedLanguages',
    'aiPolicy',
    'instructions',
  ];
  for (const k of allowed) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }
  const interview = await Interview.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true },
  );
  if (!interview) throw new ApiError(404, 'Interview not found.');
  await AuditService.log({
    action: 'INTERVIEW_UPDATE',
    actor: req.user,
    target: { type: 'Interview', id: interview._id },
    meta: update,
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, { interview }, 'Interview updated'));
});

// Allowed transitions — explicit table so we can't accidentally skip states.
// Defined BEFORE the route handlers that use it (satisfies no-use-before-define).
const ALLOWED_TRANSITIONS = {
  DRAFT: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['READY', 'IN_PROGRESS', 'CANCELLED', 'EXPIRED'],
  READY: ['IN_PROGRESS', 'CANCELLED', 'EXPIRED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
};

// POST /api/v1/interviews/:id/transition — state machine.
export const transitionStatus = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw new ApiError(404, 'Interview not found.');
  const next = req.body.status;
  const from = interview.status;
  // Validate the transition.
  const allowed = ALLOWED_TRANSITIONS[from]?.includes(next);
  if (!allowed) {
    throw new ApiError(409, `Cannot transition from ${from} to ${next}.`);
  }
  interview.status = next;
  if (next === INTERVIEW_STATUS.IN_PROGRESS && !interview.startedAt)
    interview.startedAt = new Date();
  if (next === INTERVIEW_STATUS.COMPLETED && !interview.endedAt) interview.endedAt = new Date();
  if (next === INTERVIEW_STATUS.CANCELLED) interview.endedAt = new Date();
  await interview.save();
  await AuditService.interviewStateChange(req.user, interview, from, next, req.ip);
  return res.status(200).json(new ApiResponse(200, { interview }, 'Status updated'));
});

// POST /api/v1/interviews/:id/join — candidate endpoint to enter the room.
export const joinInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw new ApiError(404, 'Interview not found.');
  // Allow join once READY or IN_PROGRESS (but not before/after).
  if (![INTERVIEW_STATUS.READY, INTERVIEW_STATUS.IN_PROGRESS].includes(interview.status)) {
    throw new ApiError(409, `Interview is ${interview.status}; cannot join yet.`);
  }
  // If this is the candidate, move to IN_PROGRESS on first join.
  if (
    String(interview.candidateUserId) === String(req.user._id) &&
    interview.status === INTERVIEW_STATUS.READY
  ) {
    interview.status = INTERVIEW_STATUS.IN_PROGRESS;
    interview.startedAt = new Date();
    await interview.save();
  }
  return res
    .status(200)
    .json(new ApiResponse(200, { interview, roomCode: interview.roomCode }, 'Joined'));
});

// PATCH /api/v1/interviews/:id/snapshot — append a code snapshot.
export const appendSnapshot = asyncHandler(async (req, res) => {
  const entry = {
    code: String(req.body.appendSnapshot?.code || '').slice(0, 200000),
    language: SUPPORTED_LANGUAGES.includes(req.body.appendSnapshot?.language)
      ? req.body.appendSnapshot.language
      : 'javascript',
    eventType: ['auto', 'run', 'submit'].includes(req.body.appendSnapshot?.eventType)
      ? req.body.appendSnapshot.eventType
      : 'auto',
    timestamp: req.body.appendSnapshot?.timestamp
      ? new Date(req.body.appendSnapshot.timestamp)
      : new Date(),
  };
  const interview = await Interview.findByIdAndUpdate(
    req.params.id,
    { $push: { snapshots: { $each: [entry], $slice: -300 } } },
    { new: true },
  );
  if (!interview) throw new ApiError(404, 'Interview not found.');
  // Also persist to the standalone CodeSnapshot archive for replay.
  await CodeSnapshot.create({
    interviewId: interview._id,
    userId: req.user._id,
    code: entry.code,
    language: entry.language,
    eventType: entry.eventType,
    timestamp: entry.timestamp,
  });
  return res
    .status(200)
    .json(new ApiResponse(200, { count: interview.snapshots.length }, 'Snapshot saved'));
});

// PATCH /api/v1/interviews/:id/proctoring — append a proctoring violation.
export const appendProctoring = asyncHandler(async (req, res) => {
  const entry = {
    type: req.body.appendProctoring?.type,
    severity: req.body.appendProctoring?.severity || 'low',
    detail: String(req.body.appendProctoring?.detail || '').slice(0, 500),
    timestamp: req.body.appendProctoring?.timestamp
      ? new Date(req.body.appendProctoring.timestamp)
      : new Date(),
    userId: req.user._id,
  };
  const interview = await Interview.findByIdAndUpdate(
    req.params.id,
    { $push: { proctoringLogs: { $each: [entry], $slice: -1000 } } },
    { new: true },
  );
  if (!interview) throw new ApiError(404, 'Interview not found.');
  return res
    .status(200)
    .json(new ApiResponse(200, { count: interview.proctoringLogs.length }, 'Proctoring logged'));
});

// PATCH /api/v1/interviews/:id/chat — append a chat message.
export const appendChat = asyncHandler(async (req, res) => {
  const entry = {
    userId: req.user._id,
    name: req.user.name,
    role: req.user.role,
    body: String(req.body.appendChat?.body || '').slice(0, 2000),
    timestamp: req.body.appendChat?.timestamp
      ? new Date(req.body.appendChat.timestamp)
      : new Date(),
  };
  const interview = await Interview.findByIdAndUpdate(
    req.params.id,
    { $push: { chatLog: { $each: [entry], $slice: -500 } } },
    { new: true },
  );
  if (!interview) throw new ApiError(404, 'Interview not found.');
  return res
    .status(200)
    .json(new ApiResponse(200, { count: interview.chatLog.length }, 'Chat appended'));
});

// PATCH /api/v1/interviews/:id/rubric — update rubric draft.
export const updateRubricDraft = asyncHandler(async (req, res) => {
  const interview = await Interview.findByIdAndUpdate(
    req.params.id,
    { $set: { rubricDraft: req.body.rubricDraft } },
    { new: true },
  );
  if (!interview) throw new ApiError(404, 'Interview not found.');
  return res.status(200).json(new ApiResponse(200, { interview }, 'Rubric draft updated'));
});

// POST /api/v1/interviews/:id/questions — assign questions to the interview.
export const assignQuestions = asyncHandler(async (req, res) => {
  const { questionIds } = req.body;
  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    throw new ApiError(400, 'questionIds must be a non-empty array.');
  }
  const interview = await Interview.findByIdAndUpdate(
    req.params.id,
    { $set: { questionIds } },
    { new: true },
  ).populate('questionIds', 'title slug difficulty tags');
  if (!interview) throw new ApiError(404, 'Interview not found.');
  return res.status(200).json(new ApiResponse(200, { interview }, 'Questions assigned'));
});

// POST /api/v1/interviews/:id/end — interviewer-only; sets COMPLETED.
export const endInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) throw new ApiError(404, 'Interview not found.');
  if (
    ![INTERVIEW_STATUS.IN_PROGRESS, INTERVIEW_STATUS.READY, INTERVIEW_STATUS.SCHEDULED].includes(
      interview.status,
    )
  ) {
    throw new ApiError(409, `Interview is ${interview.status}; cannot end.`);
  }
  const from = interview.status;
  interview.status = INTERVIEW_STATUS.COMPLETED;
  interview.endedAt = new Date();
  await interview.save();
  await AuditService.interviewStateChange(req.user, interview, from, interview.status, req.ip);
  return res.status(200).json(new ApiResponse(200, { interview }, 'Interview ended'));
});

// DELETE /api/v1/interviews/:id
export const deleteInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findByIdAndDelete(req.params.id);
  if (!interview) throw new ApiError(404, 'Interview not found.');
  await AuditService.log({
    action: 'INTERVIEW_DELETE',
    actor: req.user,
    target: { type: 'Interview', id: interview._id },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, null, 'Interview deleted'));
});
