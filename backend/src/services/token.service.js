// src/services/token.service.js
// Pure JWT helpers — no mongoose import (so user.model.js can import it without a cycle).
// We use jsonwebtoken directly. The caller (user.model.js / generateTokens.js) is
// responsible for persisting the refresh token hash on the User/Session doc.
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Build the standard JWT payload — user identity + role + a stable email field.
// `jti` makes the token uniquely identifiable for revocation lists if needed.
function payloadFor(user) {
  const id = user?._id?.toString?.() || user?.id || user?._id;
  return {
    sub: id,
    email: user?.email,
    role: user?.role,
    name: user?.name,
    jti: `${id}-${Date.now()}`,
  };
}

// Short-lived (15m default) access token used for API auth.
export function generateAccessToken(user) {
  const secret = env.JWT_ACCESS_SECRET;
  if (!secret) {
    // In production this would crash; we re-throw so the request fails loudly.
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }
  return jwt.sign(payloadFor(user), secret, { expiresIn: env.ACCESS_TOKEN_EXPIRY });
}

// Long-lived (7d default) refresh token used to mint new access tokens.
export function generateRefreshToken(user) {
  const secret = env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign(payloadFor(user), secret, { expiresIn: env.REFRESH_TOKEN_EXPIRY });
}

// Verify an access token. Throws on invalid signature / expiry.
export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

// Verify a refresh token. Throws on invalid signature / expiry.
export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export default { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken };
