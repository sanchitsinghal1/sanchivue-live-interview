// Central constants for the Live Technical Interview & AI Assessment Platform

export const ROLES = {
  ADMIN: "admin",
  INTERVIEWER: "interviewer",
  CANDIDATE: "candidate",
} as const;

export const SUBMISSION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  WRONG_ANSWER: "WRONG_ANSWER",
  TLE: "TLE", // Time Limit Exceeded
  MLE: "MLE", // Memory Limit Exceeded
  RUNTIME_ERROR: "RUNTIME_ERROR",
} as const;

export const INTERVIEW_STATUS = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  ENDED: "ENDED",
} as const;

export const DIFFICULTY = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
} as const;

export const RECOMMENDATION = {
  STRONG_HIRE: "STRONG_HIRE",
  HIRE: "HIRE",
  LEAN_HIRE: "LEAN_HIRE",
  NO_HIRE: "NO_HIRE",
  PENDING: "PENDING",
} as const;

// Supported code execution languages. JavaScript runs out-of-the-box via the
// sandboxed VM runner. Python/Java/C++ require their toolchains to be present
// on the host; the runner falls back gracefully if the binary is missing.
export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", monacoId: "javascript" },
  { id: "python", label: "Python", monacoId: "python" },
  { id: "java", label: "Java", monacoId: "java" },
  { id: "cpp", label: "C++", monacoId: "cpp" },
] as const;

// Default dark IDE theme for the Monaco editor
export const MONACO_THEME = "vs-dark";

// Structured rubric criteria used by the interviewer scorecard and AI summary.
export const RUBRIC_CRITERIA = [
  {
    key: "problemSolving",
    label: "Problem Solving",
    description: "Approach correctness, decomposition, and algorithmic thinking.",
  },
  {
    key: "cleanCode",
    label: "Clean Code",
    description: "Naming, structure, readability, and maintainability.",
  },
  {
    key: "optimization",
    label: "Optimization",
    description: "Time/space complexity awareness and improvement.",
  },
  {
    key: "communication",
    label: "Communication",
    description: "Clarity of thought, explanation of trade-offs.",
  },
  {
    key: "edgeCases",
    label: "Edge Cases",
    description: "Handling of empty inputs, negatives, overflow, boundary values.",
  },
] as const;

export const PROCTORING_SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

// Collab service port (must match mini-services/collab-service)
export const COLLAB_PORT = 3003;

// Session cookie name (1% configuration: this is the signed JWT cookie used to
// authenticate API requests. No external credential needed.)
export const SESSION_COOKIE = "lit_session";

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds
