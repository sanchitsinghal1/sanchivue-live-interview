// src/middlewares/orgAccess.middleware.js
// Verifies the authenticated user is a member of the org referenced in the
// request (via req.params.orgId, req.body.orgId, or req.query.orgId). Sets
// req.membership to the OrganizationMember doc so downstream handlers can read
// the user's role without re-querying.
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import OrganizationMember from '../models/organizationMember.model.js';
import Organization from '../models/organization.model.js';
import { USER_ROLES } from '../config/constants.js';

// requireOrgMember — enforces "must be in this org". Admins bypass.
export const requireOrgMember = asyncHandler(async (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Authentication required.');
  }
  const orgId = req.params.orgId || req.body?.orgId || req.query?.orgId;
  if (!orgId) {
    throw new ApiError(400, 'Organization id is required.');
  }
  // Platform admins can access any org.
  if (req.user.role === USER_ROLES.ADMIN) {
    req.membership = { role: 'admin', isPlatformAdmin: true };
    req.orgId = orgId;
    return next();
  }

  const membership = await OrganizationMember.findOne({ orgId, userId: req.user._id });
  if (!membership || membership.status !== 'ACTIVE') {
    throw new ApiError(403, 'You do not have access to this organization.');
  }
  req.membership = membership;
  req.orgId = orgId;
  next();
});

// requireOrgRole(...roles) — gates to specific org-level roles.
export const requireOrgRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    // requireOrgMember must run first.
    if (!req.membership) {
      throw new ApiError(500, 'requireOrgRole must be mounted after requireOrgMember.');
    }
    // Platform admins always pass.
    if (req.membership.isPlatformAdmin) return next();
    if (!roles.includes(req.membership.role)) {
      throw new ApiError(403, `This action requires org role: ${roles.join(', ')}.`);
    }
    next();
  });

// requireOrgOwner — only the owner (or platform admin).
export const requireOrgOwner = asyncHandler(async (req, _res, next) => {
  if (!req.user) throw new ApiError(401, 'Authentication required.');
  const orgId = req.params.orgId || req.body?.orgId;
  if (req.user.role === USER_ROLES.ADMIN) {
    req.orgId = orgId;
    return next();
  }
  const org = await Organization.findById(orgId).lean();
  if (!org) throw new ApiError(404, 'Organization not found.');
  if (String(org.ownerId) !== String(req.user._id)) {
    throw new ApiError(403, 'Only the organization owner may perform this action.');
  }
  req.orgId = orgId;
  next();
});

export default { requireOrgMember, requireOrgRole, requireOrgOwner };
