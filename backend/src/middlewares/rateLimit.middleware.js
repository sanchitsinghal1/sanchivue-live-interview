// src/middlewares/rateLimit.middleware.js
// Pre-configured express-rate-limit instances for sensitive endpoints.
// We don't enable the global limiter in production — production sits behind a
// CDN/proxy — but we DO rate-limit auth + submissions + AI unconditionally.
import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

// Generic auth rate limiter — login/register/forgot-password.
export const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH_WINDOW_MS,
  max: RATE_LIMITS.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please retry later.' },
});

// Submissions rate limiter — run/submit endpoints.
export const submitLimiter = rateLimit({
  windowMs: RATE_LIMITS.SUBMIT_WINDOW_MS,
  max: RATE_LIMITS.SUBMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many code submissions. Slow down.' },
});

// AI rate limiter — copilot / assessment / summary.
export const aiLimiter = rateLimit({
  windowMs: RATE_LIMITS.AI_WINDOW_MS,
  max: RATE_LIMITS.AI_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait a moment.' },
});

// Loose global limiter — protects against runaway clients hitting any endpoint.
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

export default { authLimiter, submitLimiter, aiLimiter, globalLimiter };
