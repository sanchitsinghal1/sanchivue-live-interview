// src/routes/organization.routes.js
import { Router } from 'express';
import {
  createOrg,
  listOrgs,
  getOrg,
  updateOrg,
  deleteOrg,
  listMembers,
  updateMemberRole,
  removeMember,
  invite,
  acceptInvite,
  revokeInvite,
  listInvitations,
} from '../controllers/organization.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  requireOrgMember,
  requireOrgRole,
  requireOrgOwner,
} from '../middlewares/orgAccess.middleware.js';

const router = Router();

// All organization routes require authentication.
router.use(verifyJWT);

// Create + accept-invite are open to any authenticated user.
router.post('/', createOrg);
router.post('/accept-invite', acceptInvite);

// List orgs the caller belongs to.
router.get('/', listOrgs);

// Per-org routes — require membership.
router.get('/:orgId', requireOrgMember, getOrg);
router.patch('/:orgId', requireOrgMember, requireOrgRole('orgOwner', 'orgAdmin'), updateOrg);
router.delete('/:orgId', requireOrgOwner, deleteOrg);

// Members.
router.get('/:orgId/members', requireOrgMember, listMembers);
router.patch(
  '/:orgId/members/:userId',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin'),
  updateMemberRole,
);
router.delete(
  '/:orgId/members/:userId',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin'),
  removeMember,
);

// Invitations.
router.post(
  '/:orgId/invite',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin', 'recruiter'),
  invite,
);
router.get('/:orgId/invitations', requireOrgMember, listInvitations);
router.post(
  '/:orgId/invitations/:invitationId/revoke',
  requireOrgMember,
  requireOrgRole('orgOwner', 'orgAdmin'),
  revokeInvite,
);

export default router;
