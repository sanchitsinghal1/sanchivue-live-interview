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
} from '../controllers/question.controller.js';
import { verifyJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { requireOrgMember, requireOrgRole } from '../middlewares/orgAccess.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createQuestionSchema, updateQuestionSchema } from '../validators/question.validator.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

// List is open to any org member.
router.get('/', listQuestions);

// AI generate (JD → blueprint preview).
router.post(
  '/ai-generate',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  aiGenerateFromJD,
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
