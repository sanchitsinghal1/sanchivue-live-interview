// src/config/constants.js
// Brand-level constants shared across the codebase. Keep magic strings here so
// we can change them in one place.

// Sanchivue brand identity.
export const APP_NAME = 'Sanchivue';
export const APP_TAGLINE = 'Live Technical Interview & AI Assessment Platform';
export const CREATOR = 'Sanchit Singhal';
export const DB_NAME = 'sanchivue';

// API versioning — all routes are mounted under /api/v1.
export const API_PREFIX = '/api/v1';

// User role enum — every user is exactly one of these.
// `admin` is a platform super-admin (cross-tenant). Others are org-scoped.
export const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  ORG_OWNER: 'orgOwner',
  ORG_ADMIN: 'orgAdmin',
  RECRUITER: 'recruiter',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
});
export const USER_ROLE_VALUES = Object.values(USER_ROLES);

// Organization member roles — a user can have different roles in different orgs.
export const ORG_ROLES = Object.freeze({
  OWNER: 'orgOwner',
  ADMIN: 'orgAdmin',
  RECRUITER: 'recruiter',
  INTERVIEWER: 'interviewer',
});

// Interview lifecycle states — every interview moves through these in order.
export const INTERVIEW_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
});
export const INTERVIEW_STATUS_VALUES = Object.values(INTERVIEW_STATUS);

// Submission verdict enum — matches the code execution service outcomes.
export const SUBMISSION_STATUS = Object.freeze({
  ACCEPTED: 'ACCEPTED',
  WRONG_ANSWER: 'WRONG_ANSWER',
  TLE: 'TLE',
  MLE: 'MLE',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  PENDING: 'PENDING',
});
export const SUBMISSION_STATUS_VALUES = Object.values(SUBMISSION_STATUS);

// Final hiring recommendation recorded against an Evaluation.
export const RECOMMENDATION = Object.freeze({
  STRONG_HIRE: 'STRONG_HIRE',
  HIRE: 'HIRE',
  LEAN_HIRE: 'LEAN_HIRE',
  NO_HIRE: 'NO_HIRE',
  PENDING: 'PENDING',
});

// Difficulty enum used by Question.
export const DIFFICULTY = Object.freeze({
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
});
export const DIFFICULTY_VALUES = Object.values(DIFFICULTY);

// Programming languages supported by the platform UI / runner.
export const SUPPORTED_LANGUAGES = Object.freeze(['javascript', 'python', 'java', 'cpp']);

// Rubric criteria — must match what the Evaluation Report view expects.
export const RUBRIC_CRITERIA = Object.freeze([
  { key: 'problemSolving', label: 'Problem Solving', max: 10 },
  { key: 'correctness', label: 'Correctness', max: 10 },
  { key: 'codeQuality', label: 'Code Quality', max: 10 },
  { key: 'communication', label: 'Communication', max: 10 },
  { key: 'debugging', label: 'Debugging', max: 10 },
  { key: 'testing', label: 'Testing', max: 10 },
  { key: 'design', label: 'Design', max: 10 },
  { key: 'complexity', label: 'Complexity', max: 10 },
]);

// Rate-limit windows — expressed in ms. Used by middlewares/rateLimit.middleware.js.
export const RATE_LIMITS = Object.freeze({
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 min
  AUTH_MAX: 30,
  SUBMIT_WINDOW_MS: 60 * 1000, // 1 min
  SUBMIT_MAX: 20,
  AI_WINDOW_MS: 60 * 1000,
  AI_MAX: 30,
});

// Audit log source identifier so downstream tools can attribute events.
export const AUDIT_SOURCE = APP_NAME;

// Default sandbox limits for the code execution service.
export const DEFAULT_TIME_LIMIT_MS = 2000;
export const DEFAULT_MEMORY_LIMIT_MB = 256;
export const MAX_STDOUT_BYTES = 256 * 1024;

// Socket presence / snapshot caps (in-memory).
export const SOCKET_PRESENCE_MAX = 64;
export const SOCKET_SNAPSHOT_MAX = 200;
export const SOCKET_THROTTLE_MS = 1000; // throttle writes to the Interview doc

// File upload caps for Multer.
export const UPLOAD_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_AVATAR = ['image/png', 'image/jpeg', 'image/webp'];
export const ALLOWED_MIME_RESUME = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
