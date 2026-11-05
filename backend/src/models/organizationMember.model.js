// src/models/organizationMember.model.js
// Junction between User and Organization — a single user can be a member of many
// orgs with different roles. Compound unique index (orgId, userId) prevents dupes.
import mongoose from 'mongoose';
import { ORG_ROLES } from '../config/constants.js';

const organizationMemberSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Role this user holds inside this specific org.
    role: {
      type: String,
      enum: Object.values(ORG_ROLES),
      default: ORG_ROLES.INTERVIEWER,
    },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // ACTIVE | PENDING (pending = invited but not yet accepted)
    status: { type: String, enum: ['ACTIVE', 'PENDING'], default: 'ACTIVE', index: true },
    title: { type: String, default: '' }, // e.g. "Senior Engineer"
  },
  { timestamps: true },
);

// A user can be added to an org only once.
organizationMemberSchema.index({ orgId: 1, userId: 1 }, { unique: true });
// Support listing members of an org sorted by role/joinedAt.
organizationMemberSchema.index({ orgId: 1, role: 1 });

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);
export default OrganizationMember;
