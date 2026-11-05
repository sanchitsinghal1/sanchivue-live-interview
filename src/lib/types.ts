// Shared TypeScript types and JSON encode/decode helpers for the platform.
// SQLite stores complex structures as JSON strings; these helpers centralize
// the parsing so controllers stay readable.

export interface TestCase {
  input: string; // JSON-encoded array of arguments, e.g. "[[2,7,11,15],9]"
  expectedOutput: string; // JSON-encoded expected return value, e.g. "[0,1]"
  explanation?: string;
  weight?: number;
  isHidden?: boolean;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface StarterCode {
  javascript: string;
  python: string;
  java: string;
  cpp: string;
}

export interface CodeSnapshot {
  timestamp: number;
  code: string;
  language: string;
  eventType: "auto" | "run" | "submit";
}

export interface ProctoringLog {
  type: "tab-switch" | "window-blur" | "paste-anomaly" | "fullscreen-exit";
  detail: string;
  severity: "low" | "medium" | "high";
  timestamp: number;
}

export interface ChatMessage {
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
}

export interface RubricScores {
  problemSolving: number;
  cleanCode: number;
  optimization: number;
  communication: number;
  edgeCases: number;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
  memoryKb: number;
  status: string;
  isHidden: boolean;
}

export interface RunResult {
  passedCount: number;
  totalCount: number;
  results: TestResult[];
  overallStatus: string;
  executionTimeMs: number;
  memoryKb: number;
  stdout: string;
  stderr: string;
}

export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function stringifyJSON(value: unknown): string {
  return JSON.stringify(value);
}

// Serialize a RubricScores object to a plain record for storage.
export function emptyRubric(): RubricScores {
  return {
    problemSolving: 0,
    cleanCode: 0,
    optimization: 0,
    communication: 0,
    edgeCases: 0,
  };
}

// Public-safe user shape returned to the client (never includes password).
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  resumeUrl: string | null;
}

// Deep equality that treats arrays of primitives as order-insensitive sets
// when both sides are arrays of primitives. This keeps the test runner lenient
// for problems like Two Sum where index order is unspecified.
export function deepEqualLenient(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // For arrays of primitives, compare as sorted sets
    const aPrims = a.every((x) => typeof x !== "object" || x === null);
    const bPrims = b.every((x) => typeof x !== "object" || x === null);
    if (aPrims && bPrims) {
      const sa = [...a].map((x) => JSON.stringify(x)).sort();
      const sb = [...b].map((x) => JSON.stringify(x)).sort();
      return sa.every((v, i) => v === sb[i]);
    }
    return a.every((v, i) => deepEqualLenient(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ak = Object.keys(a as object);
    const bk = Object.keys(b as object);
    if (ak.length !== bk.length) return false;
    return ak.every((k) =>
      deepEqualLenient(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k]
      )
    );
  }
  return false;
}
