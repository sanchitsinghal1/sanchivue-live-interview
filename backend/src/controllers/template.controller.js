// src/controllers/template.controller.js
// InterviewTemplate CRUD — reusable question sets + rubric + duration that a
// recruiter can apply to a new interview in one click (POST /interviews accepts
// `templateId` and the createInterview controller seeds defaults from it).
import InterviewTemplate from '../models/interviewTemplate.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginateQuery } from '../utils/pagination.js';
import { AuditService } from '../services/audit.service.js';
import { USER_ROLES } from '../config/constants.js';

// Helper — restrict to interviewer/admin platform role, or org-level
// recruiter/admin/owner. We don't accept any payload that doesn't include
// either an orgId (in body or query) for an org the user belongs to, OR the
// user is a platform admin.
function authorizeWriter(req) {
  if (req.user.role === USER_ROLES.ADMIN) return true;
  // Org-scoped write access requires req.membership to have been resolved by
  // requireOrgMember + requireOrgRole upstream. We allow orgOwner / orgAdmin /
  // recruiter / interviewer to author templates.
  if (!req.membership) return false;
  return ['orgOwner', 'orgAdmin', 'recruiter', 'interviewer'].includes(
    req.membership.role,
  );
}

// POST /api/v1/interview-templates
export const createTemplate = asyncHandler(async (req, res) => {
  const orgId = req.body.orgId || req.orgId;
  if (!orgId) throw new ApiError(400, 'orgId is required.');
  if (!authorizeWriter(req)) {
    throw new ApiError(403, 'You do not have permission to create templates.');
  }
  const payload = { ...req.body, orgId, createdBy: req.user._id };
  // Defensive: never trust client-supplied archived flag on create.
  delete payload.isArchived;
  const template = await InterviewTemplate.create(payload);
  await AuditService.log({
    action: 'TEMPLATE_CREATE',
    actor: req.user,
    target: { type: 'InterviewTemplate', id: template._id },
    meta: { name: template.name },
    ip: req.ip,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, { template }, 'Template created'));
});

// GET /api/v1/interview-templates — list templates scoped to the org (and
// optionally only the caller's own drafts).
export const listTemplates = asyncHandler(async (req, res) => {
  const orgId = req.query.orgId || req.orgId;
  if (!orgId) throw new ApiError(400, 'orgId is required.');
  const filter = { orgId, isArchived: false };
  if (req.query.mine === 'true') filter.createdBy = req.user._id;
  if (req.query.difficulty) filter.difficulty = req.query.difficulty;
  if (req.query.type) filter.type = req.query.type;
  if (req.query.q) filter.name = { $regex: req.query.q, $options: 'i' };
  const pagination = getPagination(req);
  const result = await paginateQuery(InterviewTemplate, filter, pagination, [
    { path: 'questionIds', select: 'title slug difficulty tags' },
    { path: 'createdBy', select: 'name email' },
  ]);
  return res.status(200).json(new ApiResponse(200, result, 'Templates'));
});

// GET /api/v1/interview-templates/:id
export const getTemplate = asyncHandler(async (req, res) => {
  const template = await InterviewTemplate.findById(req.params.id)
    .populate('questionIds', 'title slug difficulty tags type')
    .populate('createdBy', 'name email')
    .lean();
  if (!template) throw new ApiError(404, 'Template not found.');
  return res.status(200).json(new ApiResponse(200, { template }, 'Template'));
});

// PATCH /api/v1/interview-templates/:id
export const updateTemplate = asyncHandler(async (req, res) => {
  const template = await InterviewTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Template not found.');
  // Org-scoped write check.
  if (req.user.role !== USER_ROLES.ADMIN) {
    if (
      String(template.orgId) !== String(req.orgId || req.body?.orgId) ||
      !req.membership ||
      !['orgOwner', 'orgAdmin', 'recruiter', 'interviewer'].includes(req.membership.role)
    ) {
      throw new ApiError(403, 'You do not have permission to edit this template.');
    }
  }
  const allowed = [
    'name',
    'description',
    'questionIds',
    'jobRole',
    'difficulty',
    'type',
    'durationMin',
    'allowedLanguages',
    'rubric',
    'isArchived',
  ];
  for (const k of allowed) {
    if (req.body[k] !== undefined) template[k] = req.body[k];
  }
  await template.save();
  await AuditService.log({
    action: 'TEMPLATE_UPDATE',
    actor: req.user,
    target: { type: 'InterviewTemplate', id: template._id },
    meta: { name: template.name },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, { template }, 'Template updated'));
});

// DELETE /api/v1/interview-templates/:id — hard delete (or use isArchived).
export const deleteTemplate = asyncHandler(async (req, res) => {
  const template = await InterviewTemplate.findById(req.params.id);
  if (!template) throw new ApiError(404, 'Template not found.');
  if (req.user.role !== USER_ROLES.ADMIN) {
    if (
      String(template.orgId) !== String(req.orgId) ||
      !req.membership ||
      !['orgOwner', 'orgAdmin'].includes(req.membership.role)
    ) {
      throw new ApiError(403, 'Only org owners/admins can delete templates.');
    }
  }
  await template.deleteOne();
  await AuditService.log({
    action: 'TEMPLATE_DELETE',
    actor: req.user,
    target: { type: 'InterviewTemplate', id: template._id },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, null, 'Template deleted'));
});
