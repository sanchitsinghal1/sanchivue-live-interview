// src/routes/question.routes.js
import { Router } from 'express';
import {
  createQuestion,
  listQuestions,
  getQuestion,
  getQuestionAdmin,
  updateQuestion,
  deleteQuestion,
  aiGenerateFromJD,
  aiGenerateQuestion,
} from '../controllers/question.controller.js';
import { exportQuestions, importQuestions } from '../controllers/questionImport.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { requireOrgMember, requireOrgRole } from '../middlewares/orgAccess.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { aiLimiter } from '../middlewares/rateLimit.middleware.js';
import { createQuestionSchema, updateQuestionSchema } from '../validators/question.validator.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

// List is open to any org member.
router.get('/', listQuestions);

// Static-path routes MUST be declared BEFORE `/:id` so Express doesn't capture
// them as an id. Order below matters.
// AI generate (JD → blueprint preview).
router.post(
  '/ai-generate',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  aiLimiter,
  aiGenerateFromJD,
);

// AI generate a SINGLE question (topic + difficulty + type → question preview).
// Doesn't persist; the user reviews + edits, then clicks Save which calls
// createQuestion. Rate-limited via aiLimiter.
router.post(
  '/ai-generate-question',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  aiLimiter,
  aiGenerateQuestion,
);

// Export the org's non-archived questions as a JSON attachment. Hidden tests
// are included only for interviewer+ requesters.
router.get(
  '/export',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  exportQuestions,
);

// Import questions from a JSON array. Validates each entry, dedupes by
// (orgId, slug), returns { imported, skipped, errors[] }.
router.post(
  '/import',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  importQuestions,
);

// Create.
router.post(
  '/',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'interviewer'),
  validate(createQuestionSchema),
  createQuestion,
);

// Single question routes.
router.get('/:id', getQuestion);
// Admin view includes hidden tests — restricted to interviewers / org admins.
router.get(
  '/:id/admin',
  authorizeRoles('admin'),
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'interviewer'),
  getQuestionAdmin,
);
router.patch(
  '/:id',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'interviewer'),
  validate(updateQuestionSchema),
  updateQuestion,
);
router.delete('/:id', requireOrgMember, requireOrgRole('orgOwner', 'orgAdmin'), deleteQuestion);

export default router;
