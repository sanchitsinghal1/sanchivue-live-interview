// src/config/env.js
// Central, documented export of every environment variable used by the backend.
// Each block explains WHAT to paste and WHERE to get it. Keep this file in sync
// with /backend/.env.example. We support legacy variable names (e.g.
// `ACCESS_TOKEN_TTL`, `COOKIE_SAMESITE`, `CLIENT_ORIGIN`) for backwards
// compatibility but prefer the spec names (`ACCESS_TOKEN_EXPIRY`,
// `COOKIE_SAME_SITE`, `FRONTEND_URL`) so .env files match the docs.
import dotenv from 'dotenv';

// Load .env once at import time. Calling dotenv multiple times is safe but wasteful.
dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

// Helper that reads a var with a default and trims whitespace.
// `aliases` lets us accept multiple env names for the same setting (legacy + spec).
function read(name, fallback = '', ...aliases) {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v.trim();
  for (const alias of aliases) {
    const av = process.env[alias];
    if (av !== undefined && av !== '') return av.trim();
  }
  return fallback;
}

function readInt(name, fallback, ...aliases) {
  const v = Number.parseInt(read(name, String(fallback), ...aliases), 10);
  return Number.isFinite(v) ? v : fallback;
}

// ----------------------------------------------------------------------------
// App / runtime
// ----------------------------------------------------------------------------
export const NODE_ENV = read('NODE_ENV', 'development');
// Default port 5000 per the spec (the Next.js demo on :3000 + collab mini-service
// on :3003 leave 5000 free for the backend).
export const PORT = readInt('PORT', 5000);
// Comma-separated allowed CORS origins. Accepts FRONTEND_URL (spec) or
// CLIENT_ORIGIN (legacy). "*" only for dev.
export const FRONTEND_URL = read('FRONTEND_URL', 'http://localhost:5173', 'CLIENT_ORIGIN');
export const BACKEND_URL = read('BACKEND_URL', `http://localhost:${PORT}`);
export const ALLOWED_ORIGINS = FRONTEND_URL.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
// Legacy alias kept so existing controllers (auth/organization) that read
// CLIENT_ORIGIN directly via process.env keep working.
export const CLIENT_ORIGIN = FRONTEND_URL;

// ----------------------------------------------------------------------------
// Database (MongoDB Atlas for production; local mongo for dev)
// ----------------------------------------------------------------------------
// Get from Atlas: Connect → Drivers → connection string.
export const MONGODB_URI = read('MONGODB_URI', 'mongodb://127.0.0.1:27017/sanchivue');
export const DB_NAME = read('DB_NAME', 'sanchivue');

// ----------------------------------------------------------------------------
// JWT secrets — generate with `openssl rand -hex 32`.
// Dev fallbacks are insecure; production MUST set these.
// ----------------------------------------------------------------------------
export const JWT_ACCESS_SECRET =
  read('JWT_ACCESS_SECRET') ||
  (isProd
    ? '' // no fallback in prod — server should fail loud
    : 'sanchivue-dev-access-secret-DO-NOT-USE-IN-PROD');
export const JWT_REFRESH_SECRET =
  read('JWT_REFRESH_SECRET') || (isProd ? '' : 'sanchivue-dev-refresh-secret-DO-NOT-USE-IN-PROD');
// Token lifetimes — accept both spec (`ACCESS_TOKEN_EXPIRY`) and legacy
// (`ACCESS_TOKEN_TTL`) names so existing .env files keep working.
export const ACCESS_TOKEN_EXPIRY = read('ACCESS_TOKEN_EXPIRY', '15m', 'ACCESS_TOKEN_TTL');
export const REFRESH_TOKEN_EXPIRY = read('REFRESH_TOKEN_EXPIRY', '7d', 'REFRESH_TOKEN_TTL');
// Convenience: refresh TTL expressed in days for the Session.expiresAt calc.
export const REFRESH_TOKEN_DAYS = readInt('REFRESH_TOKEN_DAYS', 7);

// ----------------------------------------------------------------------------
// Cookies
// ----------------------------------------------------------------------------
export const COOKIE_DOMAIN = read('COOKIE_DOMAIN', '');
// `sameSite` — spec name `COOKIE_SAME_SITE`, legacy `COOKIE_SAMESITE`.
export const COOKIE_SAME_SITE = read('COOKIE_SAME_SITE', 'lax', 'COOKIE_SAMESITE');

// ----------------------------------------------------------------------------
// Cloudinary — avatar / resume uploads. Optional; returns null gracefully if absent.
// Console: https://cloudinary.com/console → Settings → API keys.
// ----------------------------------------------------------------------------
export const CLOUDINARY_CLOUD_NAME = read('CLOUDINARY_CLOUD_NAME');
export const CLOUDINARY_API_KEY = read('CLOUDINARY_API_KEY');
export const CLOUDINARY_API_SECRET = read('CLOUDINARY_API_SECRET');

// ----------------------------------------------------------------------------
// AI provider (z-ai-web-dev-sdk). Optional; local heuristic fallback if blank.
// ----------------------------------------------------------------------------
export const AI_PROVIDER = read('AI_PROVIDER');
export const AI_API_KEY = read('AI_API_KEY');
export const AI_MODEL = read('AI_MODEL');

// ----------------------------------------------------------------------------
// Code execution sandbox
// ----------------------------------------------------------------------------
// Optional Judge0 endpoint; if blank we use the local node:vm runner.
export const JUDGE0_BASE_URL = read('JUDGE0_BASE_URL');
export const JUDGE0_API_KEY = read('JUDGE0_API_KEY');

// ----------------------------------------------------------------------------
// SMTP (Nodemailer). If SMTP_HOST is blank, email service logs + returns false.
// ----------------------------------------------------------------------------
export const SMTP_HOST = read('SMTP_HOST');
export const SMTP_PORT = readInt('SMTP_PORT', 587);
export const SMTP_SECURE = read('SMTP_SECURE', 'false') === 'true';
export const SMTP_USER = read('SMTP_USER');
export const SMTP_PASS = read('SMTP_PASS');
export const SMTP_FROM = read('SMTP_FROM', 'no-reply@sanchivue.dev');

// ----------------------------------------------------------------------------
// Redis / BullMQ (optional). If blank, the submission queue runs in-memory.
// ----------------------------------------------------------------------------
export const REDIS_URL = read('REDIS_URL');

// ----------------------------------------------------------------------------
// TURN (WebRTC media relay). Signaling itself goes over Socket.io.
// ----------------------------------------------------------------------------
export const TURN_URL = read('TURN_URL');
export const TURN_USERNAME = read('TURN_USERNAME');
export const TURN_CREDENTIAL = read('TURN_CREDENTIAL');

// ----------------------------------------------------------------------------
// Seed control
// ----------------------------------------------------------------------------
export const FORCE_SEED = read('FORCE_SEED', 'false') === 'true';

// A single object re-export for convenience when a service wants all config.
export const env = {
  NODE_ENV,
  PORT,
  FRONTEND_URL,
  BACKEND_URL,
  CLIENT_ORIGIN,
  ALLOWED_ORIGINS,
  MONGODB_URI,
  DB_NAME,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
  REFRESH_TOKEN_DAYS,
  COOKIE_DOMAIN,
  COOKIE_SAME_SITE,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  AI_PROVIDER,
  AI_API_KEY,
  AI_MODEL,
  JUDGE0_BASE_URL,
  JUDGE0_API_KEY,
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  REDIS_URL,
  TURN_URL,
  TURN_USERNAME,
  TURN_CREDENTIAL,
  FORCE_SEED,
  isProd,
};

export default env;
