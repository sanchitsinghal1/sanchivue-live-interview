// src/routes/interview.routes.js
import { Router } from 'express';
import {
  createInterview,
  listInterviews,
  getInterview,
  getInterviewByRoomCode,
  updateInterview,
  transitionStatus,
  joinInterview,
  appendSnapshot,
  appendProctoring,
  appendChat,
  updateRubricDraft,
  assignQuestions,
  endInterview,
  deleteInterview,
} from '../controllers/interview.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { requireOrgMember, requireOrgRole } from '../middlewares/orgAccess.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createInterviewSchema,
  updateInterviewSchema,
  transitionStatusSchema,
  appendProctoringSchema,
  appendChatSchema,
  appendSnapshotSchema,
  updateRubricDraftSchema,
  assignQuestionSchema,
} from '../validators/interview.validator.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

// Collection routes — create requires org write access; list is open to members.
router.post(
  '/',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  validate(createInterviewSchema),
  createInterview,
);
router.get('/', listInterviews);

// By room code — used by the join page.
router.get('/by-room/:roomCode', getInterviewByRoomCode);

// Single-interview routes.
router.get('/:id', getInterview);
router.patch('/:id', validate(updateInterviewSchema), updateInterview);
router.delete('/:id', authorizeRoles('admin'), deleteInterview);

// State transitions + lifecycle.
router.post('/:id/transition', validate(transitionStatusSchema), transitionStatus);
router.post('/:id/join', joinInterview);
router.post('/:id/end', endInterview);

// Live session patches.
router.patch('/:id/snapshot', validate(appendSnapshotSchema), appendSnapshot);
router.patch('/:id/proctoring', validate(appendProctoringSchema), appendProctoring);
router.patch('/:id/chat', validate(appendChatSchema), appendChat);
router.patch('/:id/rubric', validate(updateRubricDraftSchema), updateRubricDraft);

// Assign questions.
router.post('/:id/questions', validate(assignQuestionSchema), assignQuestions);

export default router;
