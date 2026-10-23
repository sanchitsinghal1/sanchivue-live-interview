// src/models/user.model.js
// Core user model. A single user can belong to many orgs (via OrganizationMember)
// but has exactly one *platform* role (admin | orgOwner | ... | candidate).
// We hash the password with bcrypt on save and never select it by default.
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { USER_ROLE_VALUES, USER_ROLES } from '../config/constants.js';
import { env } from '../config/env.js';
import { generateAccessToken, generateRefreshToken } from '../services/token.service.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    // `select: false` means Mongoose omits it from queries unless `.select('+password')`
    password: { type: String, required: true, select: false, minlength: 6 },
    role: {
      type: String,
      enum: USER_ROLE_VALUES,
      default: USER_ROLES.CANDIDATE,
      index: true,
    },
    avatarUrl: { type: String, default: '' },
    avatarPublicId: { type: String, default: '' },
    resumeUrl: { type: String, default: '' },
    resumePublicId: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 1000 },
    skills: { type: [String], default: [] },
    // SHA-256 hash of the most-recent refresh token; lets us detect token reuse.
    refreshTokenHash: { type: String, default: '', select: false },
    emailVerifiedAt: { type: Date, default: null },
    // Single-use email verification token (hash of raw token).
    emailVerificationToken: { type: String, default: '', select: false },
    // Single-use password reset token (hash of raw token) + expiry.
    resetPasswordToken: { type: String, default: '', select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
    isSuspended: { type: Boolean, default: false, index: true },
    lastLoginAt: { type: Date, default: null },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

// Hash the password on save (only if it changed). Cost factor is low in dev for speed.
userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) return next();
  const saltRounds = env.isProd ? 12 : 10;
  try {
    this.password = await bcrypt.hash(this.password, saltRounds);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Compare a plaintext password against the stored hash.
userSchema.methods.isPasswordCorrect = async function isPasswordCorrect(password) {
  if (!password || !this.password) return false;
  try {
    return await bcrypt.compare(password, this.password);
  } catch {
    return false;
  }
};

// Generate the short-lived access JWT for this user.
userSchema.methods.generateAccessToken = function generateUserAccessToken() {
  return generateAccessToken(this);
};

// Generate the long-lived refresh JWT for this user.
userSchema.methods.generateRefreshToken = function generateUserRefreshToken() {
  return generateRefreshToken(this);
};

// JSON transform — strip fields that should never reach the client.
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.refreshTokenHash;
    delete ret.__v;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
