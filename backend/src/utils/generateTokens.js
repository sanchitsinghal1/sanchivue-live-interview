// src/utils/generateTokens.js
// Helper that issues a fresh access + refresh JWT pair for a given user id.
// We delegate to token.service.js (which uses jsonwebtoken directly) so the
// hashing + storage of the refresh token is centralized.
import User from '../models/user.model.js';
import { ApiError } from './ApiError.js';
import { generateAccessToken, generateRefreshToken } from '../services/token.service.js';

// Returns { accessToken, refreshToken }.
// Stores a HASH of the refresh token on the User doc + creates a Session row.
// Throws ApiError(404) if the user has been deleted between requests.
export async function generateAccessAndRefreshTokens(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found while generating tokens');
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Persist the refresh token hash so we can validate it on /auth/refresh and
  // revoke it on /auth/logout. We import Session lazily to avoid a cycle.
  const { default: Session } = await import('../models/session.model.js');
  await Session.create({
    userId: user._id,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    // No req available here; callers can PATCH userAgent/ip if needed.
  });
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
}

// SHA-256 of the token so the DB never stores the raw refresh token.
// (For high-traffic production you'd want a dedicated hashing service.)
import crypto from 'node:crypto';
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default generateAccessAndRefreshTokens;
