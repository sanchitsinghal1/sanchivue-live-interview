// src/services/codeExecution.service.js
// Sandboxed code execution engine.
//
// Out-of-the-box this runs JavaScript candidate code inside Node's `vm` module
// with a strict timeout, capped stdout, and memory tracking.
// Python / Java / C++ are supported IF their toolchain is present on the host
// (auto-detected); otherwise the runner returns a friendly error so the platform
// never crashes locally. Optional Judge0 adapter if JUDGE0_BASE_URL is set.
//
// Hidden tests NEVER leave this module — the runner consumes them server-side
// and only emits a per-case verdict + a single aggregated result.
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from '../config/env.js';
import {
  DEFAULT_TIME_LIMIT_MS,
  DEFAULT_MEMORY_LIMIT_MB,
  MAX_STDOUT_BYTES,
  SUBMISSION_STATUS,
} from '../config/constants.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Deep equality with lenient coercion for numbers/strings/arrays/objects.
function deepEqualLenient(a, b) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < 1e-9;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqualLenient(v, b[i]));
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    return ak.every((k) => deepEqualLenient(a[k], b[k]));
  }
  // Loose compare for string/number coercion (e.g. "1" vs 1).
  return String(a) === String(b);
}

// Defensive JSON parse — never throws; returns fallback.
function parseJSON(input, fallback) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

// Extract the function name from candidate JS so the runner can invoke it.
function detectJsFunctionName(code) {
  if (!code) return null;
  const m1 = code.match(/function\s+([A-Za-z_$][\w$]*)\s*\(/);
  if (m1) return m1[1];
  const m2 = code.match(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(/);
  return m2 ? m2[1] : null;
}

// Detect whether a system toolchain binary is on PATH.
function detectBinary(name) {
  const candidates =
    process.platform === 'win32'
      ? [`${name}.exe`, name]
      : [name, `/usr/bin/${name}`, `/usr/local/bin/${name}`];
  for (const c of candidates) {
    try {
      const which = process.platform === 'win32' ? 'where' : 'which';
      execFileSync(which, [c], { stdio: 'ignore' });
      return c;
    } catch {
      // continue
    }
    if (existsSync(c)) return c;
  }
  return null;
}

// ---------------------------------------------------------------------------
// JavaScript runner — sandboxed via node:vm
// ---------------------------------------------------------------------------
function runJavaScriptOnce(code, args, timeLimitMs) {
  const fnName = detectJsFunctionName(code);
  const start = Date.now();
  const logs = [];
  let stdoutTruncated = false;

  // Minimal, safe console that captures output without leaking host globals.
  const sandboxConsole = {
    log: (...rest) => {
      if (stdoutTruncated) return;
      const line = rest
        .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
        .join(' ');
      const projected = `${logs.join('\n')}\n${line}`;
      if (Buffer.byteLength(projected) > MAX_STDOUT_BYTES) {
        stdoutTruncated = true;
        logs.push('\n[stdout truncated by sandbox]');
      } else {
        logs.push(line);
      }
    },
  };
  sandboxConsole.error = sandboxConsole.log;
  sandboxConsole.warn = sandboxConsole.log;
  sandboxConsole.info = sandboxConsole.log;

  // Whitelist of safe globals — no `process`, no `require`, no `globalThis`.
  const sandbox = {
    console: sandboxConsole,
    __args: args,
    __result: undefined,
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
    Error,
    // Disable async side-effects (the platform runs synchronously per test).
    setTimeout: () => {},
    setInterval: () => {},
    clearTimeout: () => {},
    clearInterval: () => {},
  };

  const invocation = fnName
    ? `\n__result = typeof ${fnName} === 'function' ? ${fnName}(...__args) : undefined;`
    : `\n__result = undefined;`;

  const wrapped = `(function(){\n${code}\n${invocation}\n})();`;
  const context = vm.createContext(sandbox);

  try {
    vm.runInContext(wrapped, context, {
      timeout: Math.max(50, timeLimitMs),
      microtaskMode: 'afterEvaluate',
      filename: 'candidate.js',
    });
    const durationMs = Date.now() - start;
    const memoryKb = Math.round(process.memoryUsage().rss / 1024);
    return {
      ok: true,
      result: sandbox.__result,
      stdout: logs.join('\n'),
      stderr: '',
      durationMs,
      memoryKb,
    };
  } catch (err) {
    const durationMs = Date.now() - start;
    const memoryKb = Math.round(process.memoryUsage().rss / 1024);
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout =
      message.includes('Script execution timed out') || message.includes('terminated');
    return {
      ok: false,
      result: undefined,
      stdout: logs.join('\n'),
      stderr: isTimeout ? 'Time Limit Exceeded' : message,
      durationMs,
      memoryKb,
    };
  }
}

// ---------------------------------------------------------------------------
// Python runner — subprocess with temp file
// ---------------------------------------------------------------------------
function runPythonOnce(code, args, timeLimitMs) {
  const start = Date.now();
  const py = detectBinary('python3') || detectBinary('python');
  if (!py) {
    return {
      ok: false,
      stderr:
        'Python toolchain not installed on this host. JavaScript is fully supported out-of-the-box.',
      stdout: '',
      durationMs: 0,
      memoryKb: 0,
      result: undefined,
    };
  }
  const dir = mkdtempSync(join(tmpdir(), 'sanchivue-py-'));
  const file = join(dir, 'solution.py');
  // Inject a harness that reads JSON args from argv and prints JSON result.
  const harness = `${code}\n\nimport sys, json, types\n__args = json.loads(sys.argv[1])\n`;
  writeFileSync(file, harness);
  try {
    const out = execFileSync(py, [file, JSON.stringify(args)], {
      timeout: timeLimitMs,
      maxBuffer: MAX_STDOUT_BYTES,
      encoding: 'utf-8',
    });
    const result = parseJSON(out.trim().split('\n').pop() || 'null', out.trim());
    return {
      ok: true,
      result,
      stdout: out,
      stderr: '',
      durationMs: Date.now() - start,
      memoryKb: Math.round(process.memoryUsage().rss / 1024),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      result: undefined,
      stdout: '',
      stderr: message.includes('ETIMEDOUT') ? 'Time Limit Exceeded' : message,
      durationMs: timeLimitMs,
      memoryKb: 0,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Java / C++ runners — require a compiler; emit a friendly error otherwise.
// ---------------------------------------------------------------------------
function runJavaOnce(code, args, timeLimitMs) {
  if (!detectBinary('javac') || !detectBinary('java')) {
    return {
      ok: false,
      result: undefined,
      stderr:
        'Java toolchain not installed on this host. JavaScript is fully supported out-of-the-box.',
      stdout: '',
      durationMs: 0,
      memoryKb: 0,
    };
  }
  // Compile + run with a temp dir. We keep the harness intentionally minimal —
  // a real deployment would use Judge0 for compiled languages.
  const dir = mkdtempSync(join(tmpdir(), 'sanchivue-java-'));
  const file = join(dir, 'Main.java');
  writeFileSync(file, code);
  try {
    execFileSync('javac', [file], { timeout: 10000, encoding: 'utf-8' });
    const out = execFileSync('java', ['-cp', dir, 'Main', JSON.stringify(args)], {
      timeout: timeLimitMs,
      maxBuffer: MAX_STDOUT_BYTES,
      encoding: 'utf-8',
    });
    return {
      ok: true,
      result: parseJSON(out.trim().split('\n').pop() || 'null', out.trim()),
      stdout: out,
      stderr: '',
      durationMs: 0,
      memoryKb: Math.round(process.memoryUsage().rss / 1024),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      result: undefined,
      stdout: '',
      stderr: message.includes('ETIMEDOUT') ? 'Time Limit Exceeded' : message,
      durationMs: timeLimitMs,
      memoryKb: 0,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runCppOnce(code, args, timeLimitMs) {
  const gpp = detectBinary('g++') || detectBinary('clang++');
  if (!gpp) {
    return {
      ok: false,
      result: undefined,
      stderr:
        'C++ toolchain not installed on this host. JavaScript is fully supported out-of-the-box.',
      stdout: '',
      durationMs: 0,
      memoryKb: 0,
    };
  }
  const dir = mkdtempSync(join(tmpdir(), 'sanchivue-cpp-'));
  const src = join(dir, 'main.cpp');
  const bin = join(dir, 'main.out');
  writeFileSync(src, code);
  try {
    execFileSync(gpp, ['-std=c++17', '-O2', '-o', bin, src], { timeout: 10000, encoding: 'utf-8' });
    const out = execFileSync(bin, [JSON.stringify(args)], {
      timeout: timeLimitMs,
      maxBuffer: MAX_STDOUT_BYTES,
      encoding: 'utf-8',
    });
    return {
      ok: true,
      result: parseJSON(out.trim().split('\n').pop() || 'null', out.trim()),
      stdout: out,
      stderr: '',
      durationMs: 0,
      memoryKb: Math.round(process.memoryUsage().rss / 1024),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      result: undefined,
      stdout: '',
      stderr: message.includes('ETIMEDOUT') ? 'Time Limit Exceeded' : message,
      durationMs: timeLimitMs,
      memoryKb: 0,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Single-test-case dispatcher
// ---------------------------------------------------------------------------
function runSingleTestCase(language, code, test, timeLimitMs, memoryLimitMb) {
  const args = parseJSON(test.input, []);
  const expected = parseJSON(test.expectedOutput, null);

  let outcome;
  if (language === 'javascript') {
    outcome = runJavaScriptOnce(code, args, timeLimitMs);
  } else if (language === 'python') {
    outcome = runPythonOnce(code, args, timeLimitMs);
  } else if (language === 'java') {
    outcome = runJavaOnce(code, args, timeLimitMs);
  } else if (language === 'cpp') {
    outcome = runCppOnce(code, args, timeLimitMs);
  } else {
    outcome = {
      ok: false,
      result: undefined,
      stderr: `Unsupported language: ${language}`,
      stdout: '',
      durationMs: 0,
      memoryKb: 0,
    };
  }

  let status = SUBMISSION_STATUS.ACCEPTED;
  let passed = false;
  if (!outcome.ok) {
    status = outcome.stderr.includes('Time Limit')
      ? SUBMISSION_STATUS.TLE
      : SUBMISSION_STATUS.RUNTIME_ERROR;
    passed = false;
  } else {
    passed = deepEqualLenient(outcome.result, expected);
    if (!passed) status = SUBMISSION_STATUS.WRONG_ANSWER;
  }
  // Memory limit check (best-effort — uses host RSS).
  if (outcome.memoryKb > memoryLimitMb * 1024) {
    status = SUBMISSION_STATUS.MLE;
    passed = false;
  }

  return {
    passed,
    input: test.input,
    expected: test.expectedOutput,
    actual: outcome.result === undefined ? '' : safeStringify(outcome.result),
    stdout: outcome.stdout || '',
    stderr: outcome.stderr || '',
    executionTimeMs: outcome.durationMs,
    memoryKb: outcome.memoryKb,
    status,
    isHidden: !!test.isHidden,
  };
}

// JSON.stringify that tolerates undefined values (which JSON.stringify drops).
function safeStringify(v) {
  if (v === undefined) return 'undefined';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

// ---------------------------------------------------------------------------
// PUBLIC: runCode — main entry point used by the submissions controller + worker.
// Returns { passedCount, totalCount, results, overallStatus, executionTimeMs, memoryKb, stdout, stderr }
// ---------------------------------------------------------------------------
export function runCode(language, code, tests, timeLimitMs, memoryLimitMb) {
  // If Judge0 is configured, route there instead of the local runner.
  if (env.JUDGE0_BASE_URL) {
    return runViaJudge0(language, code, tests, timeLimitMs, memoryLimitMb);
  }

  const tl = timeLimitMs || DEFAULT_TIME_LIMIT_MS;
  const ml = memoryLimitMb || DEFAULT_MEMORY_LIMIT_MB;

  const results = (tests || []).map((t) => runSingleTestCase(language, code, t, tl, ml));
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const maxTime = results.reduce((m, r) => Math.max(m, r.executionTimeMs), 0);
  const maxMem = results.reduce((m, r) => Math.max(m, r.memoryKb), 0);
  const stdout = results
    .map((r) => r.stdout)
    .filter(Boolean)
    .join('\n');
  const stderr = results
    .map((r) => r.stderr)
    .filter(Boolean)
    .join('\n');

  let overallStatus;
  if (totalCount === 0 || passedCount === totalCount) overallStatus = SUBMISSION_STATUS.ACCEPTED;
  else if (results.some((r) => r.status === SUBMISSION_STATUS.TLE))
    overallStatus = SUBMISSION_STATUS.TLE;
  else if (results.some((r) => r.status === SUBMISSION_STATUS.MLE))
    overallStatus = SUBMISSION_STATUS.MLE;
  else if (results.some((r) => r.status === SUBMISSION_STATUS.RUNTIME_ERROR))
    overallStatus = SUBMISSION_STATUS.RUNTIME_ERROR;
  else overallStatus = SUBMISSION_STATUS.WRONG_ANSWER;

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

// ---------------------------------------------------------------------------
// Optional Judge0 adapter (axios-free — uses fetch, available in Node 18+).
// We POST a batch submission, then poll until all results are ready.
// ---------------------------------------------------------------------------

// Map our language enum → Judge0 language_id. Defined first so the adapter
// below can reference it without tripping no-use-before-define.
const JUDGE0_LANG_ID = {
  javascript: 63, // Node.js
  python: 71, // Python 3
  java: 62, // Java (OpenJDK 13.0.1)
  cpp: 54, // C++ (GCC 9.2.0)
};

async function runViaJudge0(language, code, tests, timeLimitMs, memoryLimitMb) {
  try {
    const langId = JUDGE0_LANG_ID[language];
    if (!langId) {
      throw new Error(`Judge0: no language mapping for ${language}`);
    }
    const submissions = (tests || []).map((t, i) => ({
      language_id: langId,
      source_code: code,
      stdin: t.input,
      expected_output: t.expectedOutput,
      cpu_time_limit: Math.ceil((timeLimitMs || DEFAULT_TIME_LIMIT_MS) / 1000),
      memory_limit: memoryLimitMb || DEFAULT_MEMORY_LIMIT_MB,
      // Tag with the test index so we can match results back to the test definition.
      callback: `test-${i}`,
    }));

    const createRes = await fetch(`${env.JUDGE0_BASE_URL}/submissions/batch?base64_encoded=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.JUDGE0_API_KEY ? { 'X-RapidAPI-Key': env.JUDGE0_API_KEY } : {}),
      },
      body: JSON.stringify({ submissions }),
    });
    if (!createRes.ok) throw new Error(`Judge0 create failed: ${createRes.status}`);
    const tokens = (await createRes.json()).map((s) => s.token);

    // Poll until all submissions are done (max ~30s).
    let results = [];
    for (let attempt = 0; attempt < 30; attempt++) {
      await new Promise((r) => setTimeout(r, 1000));
      const url = `${env.JUDGE0_BASE_URL}/submissions/batch?tokens=${tokens.join(',')}&base64_encoded=false`;
      const pollRes = await fetch(url, {
        headers: { ...(env.JUDGE0_API_KEY ? { 'X-RapidAPI-Key': env.JUDGE0_API_KEY } : {}) },
      });
      const body = await pollRes.json();
      results = body.submissions || [];
      if (results.every((r) => r.status && r.status.id > 2)) break; // status > 2 = finished
    }

    const mapped = results.map((r, i) => {
      const isAccepted = r.status && r.status.id === 3; // 3 = Accepted in Judge0
      return {
        passed: isAccepted,
        input: tests[i]?.input || '',
        expected: tests[i]?.expectedOutput || '',
        actual: r.stdout || '',
        stdout: r.stdout || '',
        stderr: r.stderr || r.compile_output || '',
        executionTimeMs: Number(r.time || 0) * 1000,
        memoryKb: Number(r.memory || 0),
        status: mapJudge0Status(r.status?.id),
        isHidden: !!tests[i]?.isHidden,
      };
    });

    return aggregateFromPerTest(mapped);
  } catch (err) {
    // Fail soft — fall back to the local runner.
    console.warn(`[codeExecution] Judge0 failed (${err.message}); using local runner.`);
    return runCodeLocal(language, code, tests, timeLimitMs, memoryLimitMb);
  }
}

function runCodeLocal(language, code, tests, timeLimitMs, memoryLimitMb) {
  // Same logic as runCode without the Judge0 dispatch. Used as a fallback.
  const tl = timeLimitMs || DEFAULT_TIME_LIMIT_MS;
  const ml = memoryLimitMb || DEFAULT_MEMORY_LIMIT_MB;
  const results = (tests || []).map((t) => runSingleTestCase(language, code, t, tl, ml));
  return aggregateFromPerTest(results);
}

function aggregateFromPerTest(results) {
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const maxTime = results.reduce((m, r) => Math.max(m, r.executionTimeMs), 0);
  const maxMem = results.reduce((m, r) => Math.max(m, r.memoryKb), 0);
  const stdout = results
    .map((r) => r.stdout)
    .filter(Boolean)
    .join('\n');
  const stderr = results
    .map((r) => r.stderr)
    .filter(Boolean)
    .join('\n');
  let overallStatus;
  if (totalCount === 0 || passedCount === totalCount) overallStatus = SUBMISSION_STATUS.ACCEPTED;
  else if (results.some((r) => r.status === SUBMISSION_STATUS.TLE))
    overallStatus = SUBMISSION_STATUS.TLE;
  else if (results.some((r) => r.status === SUBMISSION_STATUS.MLE))
    overallStatus = SUBMISSION_STATUS.MLE;
  else if (results.some((r) => r.status === SUBMISSION_STATUS.RUNTIME_ERROR))
    overallStatus = SUBMISSION_STATUS.RUNTIME_ERROR;
  else overallStatus = SUBMISSION_STATUS.WRONG_ANSWER;
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

function mapJudge0Status(id) {
  if (id === 3) return SUBMISSION_STATUS.ACCEPTED;
  if (id === 5) return SUBMISSION_STATUS.WRONG_ANSWER;
  if (id === 1 || id === 2) return SUBMISSION_STATUS.PENDING;
  if (id === 6) return SUBMISSION_STATUS.RUNTIME_ERROR;
  if (id === 7 || id === 13) return SUBMISSION_STATUS.TLE;
  if (id === 11) return SUBMISSION_STATUS.MLE;
  return SUBMISSION_STATUS.RUNTIME_ERROR;
}

export default { runCode };
