// src/middlewares/auth.middleware.js
// verifyJWT — reads the access token from cookie OR Authorization: Bearer header,
// verifies it, loads the user into req.user. Throws 401 if missing/invalid.
// authorizeRoles(...roles) — gates a route to specific roles.
import { verifyAccessToken } from '../services/token.service.js';
import User from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getDbState } from '../db/index.js';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from '../config/cookieOptions.js';

// Re-export the cookie names for routes that want to clear them on logout.
export { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME };

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  // If the DB is down we can't hydrate the user — return 503 so clients know.
  if (getDbState() !== 'connected') {
    throw new ApiError(503, 'Database unavailable — please retry shortly.');
  }
  const token =
    req.cookies?.[ACCESS_COOKIE_NAME] ||
    (req.header('Authorization')?.startsWith('Bearer ')
      ? req.header('Authorization').split(' ')[1]
      : '');

  if (!token) {
    throw new ApiError(401, 'Authentication required. Please log in.');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, 'Invalid or expired access token.');
  }

  // Load the user — explicitly skip password (already default via select:false).
  const user = await User.findById(decoded.sub).select('-password -refreshTokenHash');
  if (!user) {
    throw new ApiError(401, 'Account not found. Please log in again.');
  }
  if (user.isSuspended) {
    throw new ApiError(403, 'Your account has been suspended. Contact your administrator.');
  }

  // Expose user + token source so downstream middlewares/controllers can audit.
  req.user = user;
  req.tokenSource = req.cookies?.[ACCESS_COOKIE_NAME] ? 'cookie' : 'bearer';
  next();
});

// authorizeRoles — variadic. Returns a middleware that allows only listed roles.
// Usage: router.post('/admin', verifyJWT, authorizeRoles('admin'), handler)
export const authorizeRoles = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required.');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, `This action requires one of: ${roles.join(', ')}.`);
    }
    next();
  });

export default { verifyJWT, authorizeRoles };
