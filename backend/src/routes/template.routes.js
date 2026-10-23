// src/routes/template.routes.js
// InterviewTemplate CRUD mounted under /api/v1/interview-templates.
import { Router } from 'express';
import {
  createTemplate,
  listTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
} from '../controllers/template.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { requireOrgMember, requireOrgRole } from '../middlewares/orgAccess.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createTemplateSchema, updateTemplateSchema } from '../validators/template.validator.js';

const router = Router();

// All template routes require authentication.
router.use(verifyJWT);

// Collection routes.
router.post(
  '/',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  validate(createTemplateSchema),
  createTemplate,
);
router.get('/', requireOrgMember, listTemplates);

// Single-template routes.
router.get('/:id', getTemplate);
router.patch(
  '/:id',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter', 'interviewer'),
  validate(updateTemplateSchema),
  updateTemplate,
);
router.delete(
  '/:id',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin'),
  deleteTemplate,
);

export default router;
