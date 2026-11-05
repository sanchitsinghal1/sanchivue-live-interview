// src/models/organization.model.js
// A tenant. All interview/question resources are scoped to an org. The owner is
// the user who created the org (transferred via ownership-transfer endpoint).
import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    // URL-friendly identifier. Unique. Lowercased on save.
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    description: { type: String, default: '', maxlength: 1000 },
    logoUrl: { type: String, default: '' },
    // Per-org settings the owner/admin can flip via the dashboard.
    settings: {
      aiPolicy: {
        type: String,
        enum: ['allowed', 'hint-only', 'disabled'],
        default: 'allowed',
      },
      defaultInterviewDurationMin: { type: Number, default: 60 },
      defaultTimezone: { type: String, default: 'UTC' },
      proctoringEnabled: { type: Boolean, default: true },
      allowedLanguages: { type: [String], default: ['javascript'] },
    },
    // Soft delete — keeps audit history intact.
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

organizationSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Organization = mongoose.model('Organization', organizationSchema);
export default Organization;
