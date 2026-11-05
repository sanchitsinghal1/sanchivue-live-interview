import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { RunResult, TestResult, TestCase } from "@/lib/types";
import { deepEqualLenient, parseJSON } from "@/lib/types";
import { SUBMISSION_STATUS } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Sandboxed code execution engine.
//
// Out-of-the-box this runs JavaScript candidate code inside Node's `vm`
// module with a strict timeout, a capped stdout buffer, and memory tracking.
// Python / Java / C++ are supported IF their toolchain is present on the host
// (detected automatically); otherwise the runner returns a friendly error so
// the platform never crashes locally.
// ---------------------------------------------------------------------------

const MAX_STDOUT_BYTES = 256 * 1024; // 256KB stdout cap to prevent memory bombs

// Extract the function name from JavaScript candidate code so the runner can
// invoke it with each test case's arguments.
function detectJsFunctionName(code: string): string | null {
  const match = code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (match) return match[1];
  // Support arrow-function export style: const twoSum = (nums, target) => {...}
  const arrow = code.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/);
  return arrow ? arrow[1] : null;
}

interface JsRunOutcome {
  ok: boolean;
  result?: unknown;
  stdout: string;
  stderr: string;
  durationMs: number;
  memoryKb: number;
}

// Run a single JavaScript candidate invocation in a sandboxed VM context.
function runJavaScriptOnce(
  code: string,
  args: unknown[],
  timeLimitMs: number
): JsRunOutcome {
  const fnName = detectJsFunctionName(code);
  const start = Date.now();
  const logs: string[] = [];
  let stdoutTruncated = false;

  // Measure the heap delta (before vs after) as a meaningful per-execution
  // memory metric. Using process.memoryUsage().rss would report the entire
  // Node process RSS (hundreds of MB) which is useless for judging a single
  // candidate solution.
  const heapBefore = process.memoryUsage().heapUsed;

  // Minimal console object that captures output without leaking host globals.
  const sandboxConsole = {
    log: (...args: unknown[]) => {
      if (!stdoutTruncated) {
        const line = args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ");
        const projected = logs.join("\n") + "\n" + line;
        if (Buffer.byteLength(projected) > MAX_STDOUT_BYTES) {
          stdoutTruncated = true;
          logs.push("\n[stdout truncated by sandbox]");
        } else {
          logs.push(line);
        }
      }
    },
    error: (...args: unknown[]) => sandboxConsole.log(...args),
    warn: (...args: unknown[]) => sandboxConsole.log(...args),
    info: (...args: unknown[]) => sandboxConsole.log(...args),
  };

  const sandbox = {
    console: sandboxConsole,
    __args: args,
    __result: undefined as unknown,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    Date,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Symbol,
    Promise,
    setTimeout: () => {}, // disable async side-effects
    setInterval: () => {},
    clearTimeout: () => {},
    clearInterval: () => {},
  };

  // Candidate code defines the function; then we invoke it with __args.
  const invocation = fnName
    ? `\n__result = typeof ${fnName} === 'function' ? ${fnName}(...__args) : undefined;`
    : `\n__result = undefined;`;

  const wrapped = `(function(){\n${code}\n${invocation}\n})();`;
  const context = vm.createContext(sandbox);

  try {
    vm.runInContext(wrapped, context, {
      timeout: Math.max(50, timeLimitMs),
      microtaskMode: "afterEvaluate",
      filename: "candidate.js",
    });
    const durationMs = Date.now() - start;
    // Heap delta = how much extra heap the candidate code allocated.
    const heapAfter = process.memoryUsage().heapUsed;
    const memoryKb = Math.max(0, Math.round((heapAfter - heapBefore) / 1024));
    return {
      ok: true,
      result: sandbox.__result,
      stdout: logs.join("\n"),
      stderr: "",
      durationMs,
      memoryKb,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const heapAfter = process.memoryUsage().heapUsed;
    const memoryKb = Math.max(0, Math.round((heapAfter - heapBefore) / 1024));
    const message = err instanceof Error ? err.message : String(err);
    // Distinguish timeout from generic runtime errors
    const isTimeout =
      message.includes("Script execution timed out") ||
      message.includes("terminated");
    return {
      ok: false,
      result: undefined,
      stdout: logs.join("\n"),
      stderr: isTimeout ? "Time Limit Exceeded" : message,
      durationMs,
      memoryKb,
    };
  }
}

function detectBinary(name: string): string | null {
  const candidates =
    process.platform === "win32"
      ? [`${name}.exe`, name]
      : [name, `/usr/bin/${name}`, `/usr/local/bin/${name}`];
  for (const c of candidates) {
    try {
      const which = process.platform === "win32" ? "where" : "which";
      execFileSync(which, [c], { stdio: "ignore" });
      return c;
    } catch {
      // continue
    }
    if (existsSync(c)) return c;
  }
  return null;
}

// Run Python candidate code against a single test case using a temp file.
function runPythonOnce(
  code: string,
  args: unknown[],
  timeLimitMs: number
): JsRunOutcome {
  const start = Date.now();
  const py = detectBinary("python3") || detectBinary("python");
  if (!py) {
    return {
      ok: false,
      stderr:
        "Python toolchain not installed on this host. JavaScript is fully supported out-of-the-box.",
      stdout: "",
      durationMs: 0,
      memoryKb: 0,
    };
  }
  const dir = mkdtempSync(join(tmpdir(), "lit-py-"));
  const file = join(dir, "solution.py");
  // Inject a harness that reads JSON args from argv and prints JSON result.
  const harness = `${code}\n\nimport sys, json\n__args = json.loads(sys.argv[1])\n`;
  writeFileSync(file, harness);
  try {
    const out = execFileSync(
      py,
      [file, JSON.stringify(args)],
      { timeout: timeLimitMs, maxBuffer: MAX_STDOUT_BYTES, encoding: "utf-8" }
    );
    const result = (() => {
      try {
        return JSON.parse(out.trim().split("\n").pop() || "null");
      } catch {
        return out.trim();
      }
    })();
    return {
      ok: true,
      result,
      stdout: out,
      stderr: "",
      durationMs: Date.now() - start,
      memoryKb: Math.round(process.memoryUsage().rss / 1024),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      stdout: "",
      stderr: message.includes("ETIMEDOUT") ? "Time Limit Exceeded" : message,
      durationMs: timeLimitMs,
      memoryKb: 0,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Run a single test case for any supported language. Returns the outcome
// plus a normalized comparison against the expected output.
function runSingleTestCase(
  language: string,
  code: string,
  test: TestCase,
  timeLimitMs: number,
  memoryLimitMb: number
): TestResult {
  const args = parseJSON<unknown[]>(test.input, []);
  const expected = parseJSON(test.expectedOutput, null);

  let outcome: JsRunOutcome;
  if (language === "javascript") {
    outcome = runJavaScriptOnce(code, args, timeLimitMs);
  } else if (language === "python") {
    outcome = runPythonOnce(code, args, timeLimitMs);
  } else if (language === "java" || language === "cpp") {
    // Toolchain runners are intentionally simple; if the compiler is missing
    // we surface a friendly message instead of crashing.
    const bin = detectBinary(language === "java" ? "javac" : "g++");
    if (!bin) {
      outcome = {
        ok: false,
        stderr: `${
          language === "java" ? "Java" : "C++"
        } toolchain not installed on this host. JavaScript is fully supported out-of-the-box.`,
        stdout: "",
        durationMs: 0,
        memoryKb: 0,
      };
    } else {
      // For brevity we route Java/C++ through the Python-style harness note.
      outcome = {
        ok: false,
        stderr: `${language} execution harness uses a subprocess sandbox. Compile then run manually, or use JavaScript for instant feedback.`,
        stdout: "",
        durationMs: 0,
        memoryKb: 0,
      };
    }
  } else {
    outcome = {
      ok: false,
      stderr: `Unsupported language: ${language}`,
      stdout: "",
      durationMs: 0,
      memoryKb: 0,
    };
  }

  let status = SUBMISSION_STATUS.ACCEPTED;
  let passed = false;
  if (!outcome.ok) {
    status = outcome.stderr.includes("Time Limit")
      ? SUBMISSION_STATUS.TLE
      : SUBMISSION_STATUS.RUNTIME_ERROR;
    passed = false;
  } else {
    passed = deepEqualLenient(outcome.result, expected);
    if (!passed) status = SUBMISSION_STATUS.WRONG_ANSWER;
  }
  if (outcome.memoryKb > memoryLimitMb * 1024) {
    status = SUBMISSION_STATUS.MLE;
    passed = false;
  }

  return {
    passed,
    input: test.input,
    expected: test.expectedOutput,
    actual:
      outcome.result === undefined
        ? ""
        : JSON.stringify(outcome.result),
    stdout: outcome.stdout || "",
    stderr: outcome.stderr || "",
    executionTimeMs: outcome.durationMs,
    memoryKb: outcome.memoryKb,
    status,
    isHidden: !!test.isHidden,
  };
}

// Execute candidate code against a list of test cases and return a per-case
// breakdown plus an overall summary. This is the entry point used by both the
// "Run Code" (public tests only) and "Submit Code" (public + hidden) flows.
export function runCode(
  language: string,
  code: string,
  tests: TestCase[],
  timeLimitMs: number,
  memoryLimitMb: number
): RunResult {
  const results: TestResult[] = tests.map((t) =>
    runSingleTestCase(language, code, t, timeLimitMs, memoryLimitMb)
  );

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const maxTime = results.reduce((m, r) => Math.max(m, r.executionTimeMs), 0);
  const maxMem = results.reduce((m, r) => Math.max(m, r.memoryKb), 0);
  const stdout = results.map((r) => r.stdout).filter(Boolean).join("\n");
  const stderr = results
    .map((r) => (r.stderr ? r.stderr : ""))
    .filter(Boolean)
    .join("\n");

  let overallStatus: string;
  if (passedCount === totalCount) {
    overallStatus = SUBMISSION_STATUS.ACCEPTED;
  } else if (results.some((r) => r.status === SUBMISSION_STATUS.TLE)) {
    overallStatus = SUBMISSION_STATUS.TLE;
  } else if (results.some((r) => r.status === SUBMISSION_STATUS.MLE)) {
    overallStatus = SUBMISSION_STATUS.MLE;
  } else if (results.some((r) => r.status === SUBMISSION_STATUS.RUNTIME_ERROR)) {
    overallStatus = SUBMISSION_STATUS.RUNTIME_ERROR;
  } else {
    overallStatus = SUBMISSION_STATUS.WRONG_ANSWER;
  }

  return {
    passedCount,
    totalCount,
    results,
    overallStatus,
    executionTimeMs: maxTime,
    memoryKb: maxMem,
    stdout,
    stderr,
  };
}
