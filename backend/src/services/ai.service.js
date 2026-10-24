// src/services/ai.service.js
// Adapter around the z-ai-web-dev-sdk with deterministic local fallbacks.
//
// Why local fallbacks?
//   The platform's AI buttons must always return rich output, even when there's
//   no API key. So every public method below tries the SDK first, then falls back
//   to a heuristic that returns the same shape the LLM would have returned.
import { env } from '../config/env.js';
import { APP_NAME } from '../config/constants.js';
import AIInteraction from '../models/aiInteraction.model.js';
import { getDbState } from '../db/index.js';

// Lazily create the SDK client so we don't fail at import time if the package
// is missing or AI_API_KEY is empty.
let zaiClientPromise = null;
async function getZaiClient() {
  if (!env.AI_API_KEY) return null;
  if (!zaiClientPromise) {
    zaiClientPromise = (async () => {
      try {
        const ZaiModule = await import('z-ai-web-dev-sdk');
        const Zai = ZaiModule.default || ZaiModule;
        return await Zai.create();
      } catch (err) {
        console.warn(
          `[${APP_NAME}] AI SDK unavailable — using local fallback. Reason:`,
          err.message,
        );
        return null;
      }
    })();
  }
  return zaiClientPromise;
}

// Call the Zai chat completions endpoint. Returns the raw text response or null.
async function callZai(systemPrompt, userPrompt) {
  const zai = await getZaiClient();
  if (!zai) return null;
  try {
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      // Disable "thinking" mode — we want fast deterministic output.
      thinking: { type: 'disabled' },
    });
    return completion?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.warn(`[${APP_NAME}] AI SDK call failed — falling back. Reason:`, err.message);
    return null;
  }
}

// Defensive JSON parse: extracts the first {...} block from a possibly-noisy LLM
// response and falls back to the supplied default on failure.
function parseJsonLenient(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract the first {...} substring.
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    return fallback;
  }
}

// Persist an AIInteraction row for audit. Best-effort, never throws.
async function logInteraction({
  userId,
  kind,
  prompt,
  response,
  model,
  durationMs,
  success,
  interviewId,
  orgId,
}) {
  if (getDbState() !== 'connected') return;
  try {
    await AIInteraction.create({
      userId,
      kind,
      prompt: String(prompt || '').slice(0, 8000),
      response: String(response || '').slice(0, 16000),
      model,
      durationMs,
      success,
      interviewId: interviewId || null,
      orgId: orgId || null,
    });
  } catch (err) {
    console.warn(`[${APP_NAME}] AI interaction log failed:`, err.message);
  }
}

// ---------------------------------------------------------------------------
// PUBLIC: analyzeCandidateCode — used by the interviewer's "AI Co-Pilot" panel
// ---------------------------------------------------------------------------
// Returns { complexity, potentialBugs, edgeCases, followupQuestions, hint }
export async function analyzeCandidateCode(code, statement, ctx = {}) {
  const startedAt = Date.now();
  const fallback = localAnalyzeCandidateCode(code, statement);
  const systemPrompt = `You are a Sanchivue interview co-pilot. Given the candidate's code and the problem statement, return STRICT JSON with these keys:
- complexity: string like "O(N)" (best estimate)
- potentialBugs: array of strings (concrete bugs / off-by-one / edge cases)
- edgeCases: array of strings (missing edge cases)
- followupQuestions: array of strings (3-5 deepening questions to ask the candidate)
- hint: a single-string nudge the interviewer can give the candidate
Do not include any text outside the JSON.`;
  const userPrompt = `Problem:\n${statement || '(no statement provided)'}\n\nCandidate code:\n\`\`\`\n${code || '(empty)'}\n\`\`\``;
  const raw = await callZai(systemPrompt, userPrompt);
  const parsed = parseJsonLenient(raw, fallback);
  await logInteraction({
    userId: ctx.userId,
    kind: 'copilot',
    prompt: userPrompt,
    response: raw || JSON.stringify(fallback),
    model: raw ? env.AI_MODEL || env.AI_PROVIDER || 'z-ai' : 'local-fallback',
    durationMs: Date.now() - startedAt,
    success: !!raw,
    interviewId: ctx.interviewId,
    orgId: ctx.orgId,
  });
  return parsed;
}

// ---------------------------------------------------------------------------
// PUBLIC: generateAssessmentFromJD — used by the JD→Blueprint builder
// ---------------------------------------------------------------------------
// Returns { title, durationMin, difficulty, type, questions: [{title, difficulty, statement, tags}], rubricWeights }
export async function generateAssessmentFromJD(jdText, ctx = {}) {
  const startedAt = Date.now();
  const fallback = localGenerateAssessment(jdText);
  const systemPrompt = `You are a Sanchivue assessment designer. Given a job description, return STRICT JSON with:
- title: string
- durationMin: number (between 30 and 120)
- difficulty: "Easy" | "Medium" | "Hard"
- type: "CODING" | "SYSTEM_DESIGN" | "BEHAVIORAL" | "MIXED"
- questions: array of { title, difficulty, statement, tags[] }
- rubricWeights: object with keys problemSolving, correctness, codeQuality, communication (each 1-10)
Do not include any text outside the JSON.`;
  const userPrompt = `Job description:\n${jdText || '(empty)'}`;
  const raw = await callZai(systemPrompt, userPrompt);
  const parsed = parseJsonLenient(raw, fallback);
  await logInteraction({
    userId: ctx.userId,
    kind: 'assessment',
    prompt: userPrompt,
    response: raw || JSON.stringify(fallback),
    model: raw ? env.AI_MODEL || env.AI_PROVIDER || 'z-ai' : 'local-fallback',
    durationMs: Date.now() - startedAt,
    success: !!raw,
    orgId: ctx.orgId,
  });
  return parsed;
}

// ---------------------------------------------------------------------------
// PUBLIC: generateEvaluationSummary — used by the Evaluation Report
// ---------------------------------------------------------------------------
// Returns { summary, strengths[], concerns[], recommendation }
export async function generateEvaluationSummary(
  { rubric, proctoringLogs, passedRatio, notes },
  ctx = {},
) {
  const startedAt = Date.now();
  const fallback = localGenerateEvaluationSummary({ rubric, proctoringLogs, passedRatio, notes });
  const systemPrompt = `You are a Sanchivue hiring panel summarizer. Given rubric scores (0-10 each), proctoring alerts, the pass ratio (%), and interviewer notes, return STRICT JSON with:
- summary: string (3-5 sentences)
- strengths: array of strings
- concerns: array of strings
- recommendation: "STRONG_HIRE" | "HIRE" | "LEAN_HIRE" | "NO_HIRE"
Do not include any text outside the JSON.`;
  const userPrompt = JSON.stringify({ rubric, proctoringLogs, passedRatio, notes }, null, 2);
  const raw = await callZai(systemPrompt, userPrompt);
  const parsed = parseJsonLenient(raw, fallback);
  await logInteraction({
    userId: ctx.userId,
    kind: 'summary',
    prompt: userPrompt,
    response: raw || JSON.stringify(fallback),
    model: raw ? env.AI_MODEL || env.AI_PROVIDER || 'z-ai' : 'local-fallback',
    durationMs: Date.now() - startedAt,
    success: !!raw,
    interviewId: ctx.interviewId,
    orgId: ctx.orgId,
  });
  return parsed;
}

// ---------------------------------------------------------------------------
// PUBLIC: generateFollowupQuestions — a tiny extra for the AI routes
// ---------------------------------------------------------------------------
export async function generateFollowupQuestions(topic, ctx = {}) {
  const startedAt = Date.now();
  const fallback = localGenerateFollowups(topic);
  const systemPrompt = `Generate 5 deepening interview follow-up questions for the topic. Return STRICT JSON: { questions: string[] }`;
  const userPrompt = `Topic: ${topic || '(general DSA)'}`;
  const raw = await callZai(systemPrompt, userPrompt);
  const parsed = parseJsonLenient(raw, fallback);
  await logInteraction({
    userId: ctx.userId,
    kind: 'followups',
    prompt: userPrompt,
    response: raw || JSON.stringify(fallback),
    model: raw ? env.AI_MODEL || env.AI_PROVIDER || 'z-ai' : 'local-fallback',
    durationMs: Date.now() - startedAt,
    success: !!raw,
    orgId: ctx.orgId,
  });
  return parsed;
}

// ===========================================================================
// LOCAL FALLBACKS — deterministic, fast, no network required.
// ===========================================================================

// Naive Big-O detector — scans for common patterns (nested loops, sorts, hash maps).
function detectComplexity(code) {
  if (!code) return 'O(1)';
  // Sort → O(N log N)
  if (/\.sort\s*\(/.test(code)) return 'O(N log N)';
  // Nested for/while loops → O(N^2)
  const loopMatches = code.match(/(?:for|while)\s*\(/g) || [];
  if (loopMatches.length >= 2) return 'O(N^2)';
  // Hash map / Set usage → likely O(N) single pass
  if (/(Map|Set|new Map|new Set|\.has\(|\.get\()/.test(code)) return 'O(N)';
  // Single loop → O(N)
  if (loopMatches.length === 1) return 'O(N)';
  // Recursion (very rough heuristic)
  if (/function\s+\w+\s*\([^)]*\)\s*{[^}]*\1\s*\(/.test(code)) return 'O(2^N) (recursive)';
  return 'O(1)';
}

function localAnalyzeCandidateCode(code, statement) {
  const complexity = detectComplexity(code);
  const potentialBugs = [];
  const edgeCases = [];
  const followupQuestions = [];

  // Detect a few common anti-patterns.
  if (code && /==\s|!=\s/.test(code) && !/===|!==/.test(code)) {
    potentialBugs.push(
      'Loose equality (== / !=) — use strict === / !== to avoid type coercion bugs.',
    );
  }
  if (code && /parseInt\([^,)]+\)/.test(code)) {
    potentialBugs.push(
      'parseInt without a radix argument — pass 10 as the second arg to avoid octal surprises.',
    );
  }
  if (code && /for\s*\(\s*[^;]+in\s+/.test(code)) {
    potentialBugs.push(
      'for-in over an array iterates prototype keys too — use for-of or a numeric index loop.',
    );
  }
  if (code && !/return/.test(code)) {
    potentialBugs.push('No `return` statement detected — the function likely returns undefined.');
  }

  // Edge cases worth probing based on common DSA tropes.
  edgeCases.push('Empty input (zero-length array / empty string).');
  edgeCases.push('Single-element input.');
  edgeCases.push('Negative numbers / boundary values (e.g. MIN_INT, MAX_INT).');
  edgeCases.push('Duplicate values in the input.');

  // Follow-up questions sized to the problem statement keywords.
  const stmt = (statement || '').toLowerCase();
  if (stmt.includes('array') || stmt.includes('list')) {
    followupQuestions.push('How would your solution change for a sorted input?');
    followupQuestions.push('What is the worst-case time complexity, and where does it come from?');
  }
  if (stmt.includes('string')) {
    followupQuestions.push('How does your solution handle Unicode vs. ASCII input?');
  }
  if (stmt.includes('cache') || stmt.includes('lru')) {
    followupQuestions.push('How would you make get/put O(1) without a linked list?');
  }
  followupQuestions.push('Can you write a brute-force solution to validate against?');
  followupQuestions.push('What test cases would you add to convince yourself this is correct?');
  followupQuestions.push('How would this behave under concurrent access?');

  return {
    complexity,
    potentialBugs,
    edgeCases,
    followupQuestions,
    hint: 'Consider sketching the brute-force approach first, then identify the bottleneck.',
  };
}

function localGenerateAssessment(jd) {
  const text = (jd || '').toLowerCase();
  let difficulty = 'Medium';
  if (/senior|staff|principal|lead/.test(text)) difficulty = 'Hard';
  else if (/junior|intern|entry/.test(text)) difficulty = 'Easy';

  const type = /system design|architecture|scalab/.test(text)
    ? 'SYSTEM_DESIGN'
    : /behavioral|collaboration|communication/.test(text)
      ? 'BEHAVIORAL'
      : 'CODING';

  // A small fixed question bank tagged by JD keywords.
  const bank = [
    {
      title: 'Two Sum',
      difficulty: 'Easy',
      statement: 'Return indices of two numbers adding to a target.',
      tags: ['Arrays', 'Hashing'],
    },
    {
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      statement: 'Determine if a bracket string is valid.',
      tags: ['Stack', 'Strings'],
    },
    {
      title: 'Merge Intervals',
      difficulty: 'Medium',
      statement: 'Merge all overlapping intervals.',
      tags: ['Arrays', 'Sorting'],
    },
    {
      title: 'LRU Cache',
      difficulty: 'Medium',
      statement: 'Design an O(1) Least Recently Used cache.',
      tags: ['Design', 'Hashing'],
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      statement: 'Find the longest substring with no repeating chars.',
      tags: ['Sliding Window', 'Strings'],
    },
  ];
  // Pick 3 questions deterministically.
  const seed = text.length;
  const picks = [
    bank[seed % bank.length],
    bank[(seed + 1) % bank.length],
    bank[(seed + 2) % bank.length],
  ];

  return {
    title: 'Generated Assessment',
    durationMin: type === 'SYSTEM_DESIGN' ? 90 : 60,
    difficulty,
    type,
    questions: picks,
    rubricWeights: { problemSolving: 8, correctness: 9, codeQuality: 7, communication: 6 },
  };
}

function localGenerateEvaluationSummary({
  rubric = {},
  proctoringLogs = [],
  passedRatio = 0,
  notes = '',
}) {
  // Sum the rubric (max 80) and normalize to a 0-100 score for recommendation.
  const keys = [
    'problemSolving',
    'correctness',
    'codeQuality',
    'communication',
    'debugging',
    'testing',
    'design',
    'complexity',
  ];
  const sum = keys.reduce((acc, k) => acc + (Number(rubric[k]) || 0), 0);
  const avg = sum / (keys.length * 10); // 0..1
  const passRatio = Number(passedRatio) || 0; // 0..100
  const score = Math.round((avg * 0.6 + (passRatio / 100) * 0.4) * 100);

  let recommendation;
  if (score >= 85) recommendation = 'STRONG_HIRE';
  else if (score >= 70) recommendation = 'HIRE';
  else if (score >= 55) recommendation = 'LEAN_HIRE';
  else recommendation = 'NO_HIRE';

  // If there are many high-severity proctoring alerts, downgrade one notch.
  const highSeverity = (proctoringLogs || []).filter((l) => l.severity === 'high').length;
  if (highSeverity >= 3 && recommendation !== 'NO_HIRE') {
    recommendation =
      recommendation === 'STRONG_HIRE'
        ? 'HIRE'
        : recommendation === 'HIRE'
          ? 'LEAN_HIRE'
          : 'NO_HIRE';
  }

  const strengths = [];
  const concerns = [];

  // Heuristics on individual rubric cells.
  if ((rubric.problemSolving || 0) >= 8)
    strengths.push('Strong problem decomposition — broke the problem into clean sub-problems.');
  if ((rubric.correctness || 0) >= 8)
    strengths.push('High correctness — solution handled the visible test cases.');
  if ((rubric.codeQuality || 0) >= 8)
    strengths.push('Readable, idiomatic code with consistent naming.');
  if ((rubric.communication || 0) >= 8)
    strengths.push('Communicated assumptions and trade-offs clearly.');
  if ((rubric.testing || 0) >= 8) strengths.push('Proactively suggested edge-case tests.');

  if ((rubric.correctness || 0) < 5)
    concerns.push('Solution failed on key test cases — review the missing edge cases.');
  if ((rubric.complexity || 0) < 5)
    concerns.push('Sub-optimal time/space complexity — discuss the theoretical lower bound.');
  if ((rubric.debugging || 0) < 5)
    concerns.push('Struggled to recover when the first attempt failed.');
  if (highSeverity > 0)
    concerns.push(`${highSeverity} high-severity proctoring alert(s) recorded.`);

  const summary =
    `Candidate scored ${sum}/${keys.length * 10} on the rubric with a ${passRatio}% pass ratio (overall ${score}/100). ` +
    (notes ? `Interviewer notes: ${notes.slice(0, 280)}${notes.length > 280 ? '…' : ''} ` : '') +
    `Recommendation: ${recommendation}.`;

  return { summary, strengths, concerns, recommendation, finalScore: score };
}

function localGenerateFollowups(topic) {
  const t = (topic || '').toLowerCase();
  if (t.includes('array') || t.includes('hash')) {
    return {
      questions: [
        'Walk me through the worst-case time complexity of your solution.',
        'How would you optimize space if the input was a stream?',
        'What if the array could contain duplicates?',
        'Can you solve this without extra space?',
        'How would you test this with a property-based test?',
      ],
    };
  }
  return {
    questions: [
      'Explain the bottleneck in your solution.',
      'What input would make this perform worst?',
      'How would you parallelize this?',
      'What trade-offs did you make for readability vs. performance?',
      'How would this code fail under concurrent access?',
    ],
  };
}

export default {
  analyzeCandidateCode,
  generateAssessmentFromJD,
  generateEvaluationSummary,
  generateFollowupQuestions,
};
