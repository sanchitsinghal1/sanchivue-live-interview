// src/config/cookieOptions.js
// Shared httpOnly cookie options. We always use httpOnly + signed path so the
// browser can't read the token via JS. `secure` is forced in production.
import { env } from './env.js';

// Cookie names used by the auth flow. Exported here so controllers and middleware
// can reference them from a single source of truth.
export const ACCESS_COOKIE_NAME = 'accessToken';
export const REFRESH_COOKIE_NAME = 'refreshToken';

// Options for the access + refresh token cookies.
// `sameSite` is configurable via env (spec name `COOKIE_SAME_SITE`; default `lax`
// works for most browsers). We also accept the legacy `COOKIE_SAMESITE` alias.
export const tokenCookieOptions = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.COOKIE_SAME_SITE || 'lax',
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  path: '/',
};

// Default short-lived cookie options (e.g. CSRF or flash). Same security posture.
export const secureCookieOptions = {
  ...tokenCookieOptions,
  maxAge: 5 * 60 * 1000,
};

export default tokenCookieOptions;
