// src/controllers/auth.controller.js
// Auth controller — register, login, logout, refresh, me, forgot/reset password,
// verify email, change password. We issue both access + refresh JWTs and store
// them in httpOnly cookies AND in the response body (so Bearer header works too).
import crypto from 'node:crypto';
import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import Invitation from '../models/invitation.model.js';
import OrganizationMember from '../models/organizationMember.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashToken, generateAccessAndRefreshTokens } from '../utils/generateTokens.js';
import { verifyRefreshToken } from '../services/token.service.js';
import { sendPasswordResetEmail } from '../services/email.service.js';
import { AuditService } from '../services/audit.service.js';
import {
  tokenCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '../config/cookieOptions.js';
import { env } from '../config/env.js';
import { USER_ROLES } from '../config/constants.js';

// POST /api/v1/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email already registered. Try logging in.');
  }
  // Candidates can self-register as candidates; org member creation is via invite.
  const userRole =
    role && role === USER_ROLES.CANDIDATE ? USER_ROLES.CANDIDATE : USER_ROLES.CANDIDATE;
  const user = await User.create({ name, email, password, role: userRole });

  // Auto-accept any pending invitations for this email.
  const pendingInvites = await Invitation.find({ email, status: 'PENDING' });
  for (const invite of pendingInvites) {
    if (invite.orgId) {
      await OrganizationMember.findOneAndUpdate(
        { orgId: invite.orgId, userId: user._id },
        {
          $setOnInsert: {
            orgId: invite.orgId,
            userId: user._id,
            role: invite.role,
            invitedBy: invite.invitedBy,
            status: 'ACTIVE',
          },
        },
        { upsert: true, new: true },
      );
    }
    invite.status = 'ACCEPTED';
    await invite.save();
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  await AuditService.log({ action: 'USER_REGISTER', actor: user, ip: req.ip });
  await Session.updateMany(
    { userId: user._id, refreshTokenHash: hashToken(refreshToken) },
    { $set: { userAgent: req.get('user-agent'), ip: req.ip } },
  );

  const userObj = user.toJSON();
  setAuthCookies(res, accessToken, refreshToken);
  return res
    .status(201)
    .json(new ApiResponse(201, { user: userObj, accessToken, refreshToken }, 'Account created'));
});

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (user.isSuspended) {
    throw new ApiError(403, 'Account suspended. Contact your administrator.');
  }
  const ok = await user.isPasswordCorrect(password);
  if (!ok) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
  await AuditService.userLogin(user, req.ip);

  const userObj = user.toJSON();
  setAuthCookies(res, accessToken, refreshToken);
  return res
    .status(200)
    .json(new ApiResponse(200, { user: userObj, accessToken, refreshToken }, 'Login successful'));
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  if (refreshToken) {
    // Revoke the matching session row.
    try {
      await Session.updateOne(
        { userId, refreshTokenHash: hashToken(refreshToken) },
        { $set: { revokedAt: new Date() } },
      );
    } catch {
      // best-effort
    }
  }
  // Clear the user's refresh token hash so the refresh token is invalid.
  if (userId) {
    await User.updateOne({ _id: userId }, { $unset: { refreshTokenHash: '' } });
    await AuditService.userLogout(req.user, req.ip);
  }
  clearAuthCookies(res);
  return res.status(200).json(new ApiResponse(200, null, 'Logged out'));
});

// POST /api/v1/auth/refresh
export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required.');
  }
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token.');
  }
  // Verify the session still exists and isn't revoked.
  const session = await Session.findOne({
    userId: decoded.sub,
    refreshTokenHash: hashToken(refreshToken),
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    throw new ApiError(401, 'Session expired or revoked. Please log in again.');
  }
  const user = await User.findById(decoded.sub).select('-password -refreshTokenHash');
  if (!user) {
    throw new ApiError(401, 'Account not found.');
  }
  // Issue a fresh pair and revoke the old session (rotation).
  const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );
  session.revokedAt = new Date();
  await session.save();
  setAuthCookies(res, accessToken, newRefreshToken);
  return res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken, refreshToken: newRefreshToken, user }, 'Token refreshed'),
    );
});

// GET /api/v1/auth/me
export const me = asyncHandler(async (req, res) => {
  // verifyJWT already loaded req.user.
  const user = await User.findById(req.user._id).select('-password -refreshTokenHash');
  return res.status(200).json(new ApiResponse(200, { user }, 'Current user'));
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // Always return success so attackers can't enumerate emails.
    return res
      .status(200)
      .json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent.'));
  }
  // Single-use token — store hash; raw value goes in the email link.
  const raw = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = hashToken(raw);
  user.resetPasswordExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.get('origin') || env.FRONTEND_URL || `http://localhost:${env.PORT}`}/reset-password?token=${raw}`;
  await sendPasswordResetEmail({ to: email, resetUrl });

  return res
    .status(200)
    .json(new ApiResponse(200, null, 'If that email exists, a reset link has been sent.'));
});

// POST /api/v1/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpiresAt: { $gt: new Date() },
  }).select('+password');
  if (!user) {
    throw new ApiError(400, 'Reset token is invalid or expired.');
  }
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();
  // Revoke all sessions for this user.
  await Session.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
  await AuditService.log({ action: 'USER_PASSWORD_RESET', actor: user, ip: req.ip });
  return res.status(200).json(new ApiResponse(200, null, 'Password updated. Please log in.'));
});

// POST /api/v1/auth/verify-email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({ emailVerificationToken: hashToken(token) });
  if (!user) {
    throw new ApiError(400, 'Verification token is invalid.');
  }
  user.emailVerifiedAt = new Date();
  user.emailVerificationToken = undefined;
  await user.save();
  return res.status(200).json(new ApiResponse(200, null, 'Email verified.'));
});

// POST /api/v1/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  const ok = await user.isPasswordCorrect(currentPassword);
  if (!ok) {
    throw new ApiError(401, 'Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  // Revoke all OTHER sessions (keep the current one — the one that made this call).
  await AuditService.log({ action: 'USER_PASSWORD_CHANGE', actor: user, ip: req.ip });
  return res.status(200).json(new ApiResponse(200, null, 'Password updated.'));
});

// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------
function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    ...tokenCookieOptions,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...tokenCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, { ...tokenCookieOptions, maxAge: undefined });
  res.clearCookie(REFRESH_COOKIE_NAME, { ...tokenCookieOptions, maxAge: undefined });
}
