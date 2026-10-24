// src/controllers/organization.controller.js
// Organization + membership + invitation flows.
import Organization from '../models/organization.model.js';
import OrganizationMember from '../models/organizationMember.model.js';
import Invitation from '../models/invitation.model.js';
import Notification from '../models/notification.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginateQuery } from '../utils/pagination.js';
import { AuditService } from '../services/audit.service.js';
import { sendInvitationEmail } from '../services/email.service.js';
import { env } from '../config/env.js';
import { ORG_ROLES, USER_ROLES } from '../config/constants.js';

// Slugify — lowercase, dashes, alnum only.
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// POST /api/v1/organizations — create. Caller becomes the owner.
export const createOrg = asyncHandler(async (req, res) => {
  const { name, description, logoUrl } = req.body;
  if (!name) throw new ApiError(400, 'Organization name is required.');
  let slug = slugify(req.body.slug || name);
  if (!slug) slug = `org-${Date.now()}`;
  // Ensure slug uniqueness.
  const exists = await Organization.findOne({ slug });
  if (exists) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const org = await Organization.create({
    name,
    slug,
    ownerId: req.user._id,
    description,
    logoUrl,
    settings: req.body.settings || undefined,
  });
  // Owner is automatically an ACTIVE member with role orgOwner.
  await OrganizationMember.create({
    orgId: org._id,
    userId: req.user._id,
    role: ORG_ROLES.OWNER,
    status: 'ACTIVE',
  });
  await AuditService.log({
    action: 'ORG_CREATE',
    actor: req.user,
    target: { type: 'Organization', id: org._id },
    ip: req.ip,
  });
  return res.status(201).json(new ApiResponse(201, { organization: org }, 'Organization created'));
});

// GET /api/v1/organizations — list orgs the caller belongs to.
export const listOrgs = asyncHandler(async (req, res) => {
  // Platform admins see all orgs.
  let filter = {};
  if (req.user.role !== USER_ROLES.ADMIN) {
    const memberships = await OrganizationMember.find({
      userId: req.user._id,
      status: 'ACTIVE',
    }).select('orgId');
    filter = { _id: { $in: memberships.map((m) => m.orgId) } };
  }
  const pagination = getPagination(req);
  const result = await paginateQuery(Organization, filter, pagination);
  return res.status(200).json(new ApiResponse(200, result, 'Organizations'));
});

// GET /api/v1/organizations/:orgId
export const getOrg = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.orgId).lean();
  if (!org) throw new ApiError(404, 'Organization not found.');
  // Member counts for the dashboard.
  const memberCount = await OrganizationMember.countDocuments({ orgId: org._id, status: 'ACTIVE' });
  return res
    .status(200)
    .json(new ApiResponse(200, { organization: { ...org, memberCount } }, 'Organization'));
});

// PATCH /api/v1/organizations/:orgId
export const updateOrg = asyncHandler(async (req, res) => {
  const update = {};
  for (const k of ['name', 'description', 'logoUrl', 'settings', 'archivedAt']) {
    if (req.body[k] !== undefined) update[k] = req.body[k];
  }
  const org = await Organization.findByIdAndUpdate(req.orgId, { $set: update }, { new: true });
  await AuditService.log({
    action: 'ORG_UPDATE',
    actor: req.user,
    target: { type: 'Organization', id: org._id },
    meta: update,
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, { organization: org }, 'Organization updated'));
});

// DELETE /api/v1/organizations/:orgId — soft delete (archive).
export const deleteOrg = asyncHandler(async (req, res) => {
  const org = await Organization.findByIdAndUpdate(
    req.orgId,
    { $set: { archivedAt: new Date() } },
    { new: true },
  );
  await AuditService.log({
    action: 'ORG_DELETE',
    actor: req.user,
    target: { type: 'Organization', id: org._id },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, { organization: org }, 'Organization archived'));
});

// GET /api/v1/organizations/:orgId/members — list active members.
export const listMembers = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const result = await paginateQuery(
    OrganizationMember,
    { orgId: req.orgId, status: 'ACTIVE' },
    pagination,
    [{ path: 'userId', select: 'name email role avatarUrl' }],
  );
  return res.status(200).json(new ApiResponse(200, result, 'Members'));
});

// PATCH /api/v1/organizations/:orgId/members/:userId — change a member's role.
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!Object.values(ORG_ROLES).includes(role)) {
    throw new ApiError(400, `Invalid role. Allowed: ${Object.values(ORG_ROLES).join(', ')}.`);
  }
  const membership = await OrganizationMember.findOneAndUpdate(
    { orgId: req.orgId, userId: req.params.userId },
    { $set: { role } },
    { new: true },
  ).populate('userId', 'name email role avatarUrl');
  if (!membership) throw new ApiError(404, 'Member not found.');
  await AuditService.log({
    action: 'ORG_MEMBER_ROLE_CHANGE',
    actor: req.user,
    target: { type: 'OrganizationMember', id: membership._id },
    meta: { role },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, { membership }, 'Role updated'));
});

// DELETE /api/v1/organizations/:orgId/members/:userId — remove member.
export const removeMember = asyncHandler(async (req, res) => {
  const result = await OrganizationMember.deleteOne({
    orgId: req.orgId,
    userId: req.params.userId,
  });
  if (result.deletedCount === 0) throw new ApiError(404, 'Member not found.');
  await AuditService.log({
    action: 'ORG_MEMBER_REMOVE',
    actor: req.user,
    target: { type: 'User', id: req.params.userId },
    meta: { orgId: req.orgId },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, null, 'Member removed'));
});

// POST /api/v1/organizations/:orgId/invite — send an invitation.
export const invite = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  if (!email) throw new ApiError(400, 'Email is required.');
  if (!Object.values(ORG_ROLES).includes(role)) {
    throw new ApiError(400, `Invalid role. Allowed: ${Object.values(ORG_ROLES).join(', ')}.`);
  }
  const invitation = await Invitation.create({
    orgId: req.orgId,
    email: email.toLowerCase().trim(),
    role,
    invitedBy: req.user._id,
  });
  await AuditService.orgInvite(req.user, req.orgId, email, role, req.ip);

  // Send the email — gracefully no-ops if SMTP not configured.
  const org = await Organization.findById(req.orgId).select('name');
  const inviteUrl = `${req.get('origin') || env.FRONTEND_URL || `http://localhost:${env.PORT}`}/accept-invite?token=${invitation.token}`;
  await sendInvitationEmail({
    to: email,
    inviteUrl,
    role,
    orgName: org?.name || 'Sanchivue',
    invitedBy: req.user.name,
  });
  return res.status(201).json(new ApiResponse(201, { invitation, inviteUrl }, 'Invitation sent'));
});

// POST /api/v1/organizations/accept-invite — accept via token.
export const acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'Token is required.');
  const invitation = await Invitation.findOne({ token, status: 'PENDING' });
  if (!invitation) throw new ApiError(404, 'Invitation not found or already used.');
  if (invitation.expiresAt < new Date()) {
    invitation.status = 'EXPIRED';
    await invitation.save();
    throw new ApiError(410, 'Invitation has expired.');
  }
  // Ensure the user's email matches the invitation (or auto-update if admin flow).
  if (req.user.email.toLowerCase() !== invitation.email) {
    throw new ApiError(403, 'This invitation is for a different email address.');
  }
  // Add as a member (or update role if already exists).
  const membership = await OrganizationMember.findOneAndUpdate(
    { orgId: invitation.orgId, userId: req.user._id },
    {
      $setOnInsert: {
        orgId: invitation.orgId,
        userId: req.user._id,
        invitedBy: invitation.invitedBy,
      },
      $set: { role: invitation.role, status: 'ACTIVE' },
    },
    { upsert: true, new: true },
  );
  invitation.status = 'ACCEPTED';
  await invitation.save();
  await Notification.create({
    userId: req.user._id,
    type: 'INVITE_ACCEPTED',
    title: 'Invitation accepted',
    body: `You are now a ${invitation.role} of the organization.`,
    meta: { orgId: invitation.orgId },
  });
  return res.status(200).json(new ApiResponse(200, { membership }, 'Invitation accepted'));
});

// POST /api/v1/organizations/:orgId/invitations/:invitationId/revoke
export const revokeInvite = asyncHandler(async (req, res) => {
  const invitation = await Invitation.findOneAndUpdate(
    { _id: req.params.invitationId, orgId: req.orgId, status: 'PENDING' },
    { $set: { status: 'REVOKED' } },
    { new: true },
  );
  if (!invitation) throw new ApiError(404, 'Invitation not found.');
  await AuditService.log({
    action: 'ORG_INVITE_REVOKE',
    actor: req.user,
    target: { type: 'Invitation', id: invitation._id },
    ip: req.ip,
  });
  return res.status(200).json(new ApiResponse(200, { invitation }, 'Invitation revoked'));
});

// GET /api/v1/organizations/:orgId/invitations — list pending invites.
export const listInvitations = asyncHandler(async (req, res) => {
  const pagination = getPagination(req);
  const filter = { orgId: req.orgId };
  if (req.query.status) filter.status = req.query.status;
  const result = await paginateQuery(Invitation, filter, pagination);
  return res.status(200).json(new ApiResponse(200, result, 'Invitations'));
});
