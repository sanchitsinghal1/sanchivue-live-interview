// src/services/ai.service.js
// Adapter around the z-ai-web-dev-sdk with deterministic local fallbacks.
//
// Why local fallbacks?
//   The platform's AI buttons must always return rich output, even when there's
//   no API key. So every public method below tries the SDK first, then falls back
//   to a heuristic that returns the same shape the LLM would have returned.
import { env } from '../config/env.js';
import { APP_NAME, DIFFICULTY_VALUES } from '../config/constants.js';
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
// PUBLIC: generateQuestion — used by the AI Question Generator in QuestionBank
// ---------------------------------------------------------------------------
// Returns a single-question preview matching the Question schema:
//   { title, slug, difficulty, tags[], statement, constraints, examples[],
//     starterCode{javascript}, publicTests[], hiddenTests[],
//     optimalTime, optimalSpace, hints[] }
// Falls back to a deterministic local question picked from a small built-in bank
// indexed by topic+difficulty — so the AI Generate button ALWAYS returns rich
// output, even without an API key. The slug is made unique by the controller
// (which appends a random suffix if it collides with an existing question in
// the org).
export async function generateQuestion({ topic, difficulty, type } = {}, ctx = {}) {
  const startedAt = Date.now();
  const safeTopic = (topic || 'general').toString().slice(0, 120);
  const safeDifficulty = DIFFICULTY_VALUES.includes(difficulty) ? difficulty : 'Medium';
  const safeType = (type || 'coding').toString().toLowerCase();
  const fallback = localGenerateQuestion({ topic: safeTopic, difficulty: safeDifficulty, type: safeType });
  const systemPrompt = `You are a Sanchivue interview-question author. Return STRICT JSON only — no prose, no markdown fences — describing a single interview question.
Required shape:
{
  "title": string (<=200 chars),
  "slug": string (lowercase, dash-separated, [a-z0-9-]+, <=80 chars),
  "difficulty": "${DIFFICULTY_VALUES.join('" | "')}",
  "tags": string[] (1-5 short tags like "Arrays", "Hashing", "Sliding Window"),
  "statement": string (markdown — describe the problem; include input/output expectations; >=50 chars),
  "constraints": string (markdown — list of constraints, e.g. "1 <= n <= 10^5"),
  "examples": [{ "input": string, "output": string, "explanation": string }],
  "starterCode": { "javascript": string },
  "publicTests": [{ "input": string, "expectedOutput": string, "explanation": string }],
  "hiddenTests": [{ "input": string, "expectedOutput": string, "explanation": string }],
  "optimalTime": string (e.g. "O(N)"),
  "optimalSpace": string (e.g. "O(1)"),
  "hints": string[] (0-3 progressive hints, no spoilers)
}
The "input" / "expectedOutput" fields MUST be valid JSON strings (JSON.stringify-able). For function-style problems, use a JSON array for input args and a JSON scalar/array for expectedOutput. Include 1-2 publicTests and 2-3 hiddenTests. Do not include any text outside the JSON object.`;
  const userPrompt = `Topic: ${safeTopic}\nDifficulty: ${safeDifficulty}\nType: ${safeType}`;
  const raw = await callZai(systemPrompt, userPrompt);
  let parsed = parseJsonLenient(raw, fallback);
  // Defensive: coerce / validate the LLM output into the Question schema. If
  // validation fails we surface the local fallback rather than a raw LLM error
  // (per the spec — the user should never see "raw LLM error").
  parsed = coerceQuestion(parsed, { topic: safeTopic, difficulty: safeDifficulty, type: safeType, fallback });
  await logInteraction({
    userId: ctx.userId,
    kind: 'question',
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

// ---------------------------------------------------------------------------
// LOCAL FALLBACK QUESTION BANK (used by generateQuestion when the LLM is down).
// ---------------------------------------------------------------------------
// A small but reasonable bank of DSA questions tagged by topic + difficulty.
// The topic string the user picks is matched loosely (substring) so the
// generator returns the closest match.
const QUESTION_BANK = [
  {
    topic: 'arrays',
    difficulty: 'Easy',
    question: {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'Easy',
      tags: ['Arrays', 'Hashing'],
      statement:
        'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. Each input has exactly one solution, and you may not use the same element twice. Return the answer in any order.',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\nOnly one valid answer exists.',
      examples: [
        {
          input: 'nums = [2,7,11,15], target = 9',
          output: '[0,1]',
          explanation: 'nums[0] + nums[1] == 9, so we return [0, 1].',
        },
      ],
      starterCode: {
        javascript:
          '/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n  // your code here\n};\n',
      },
      publicTests: [
        { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', explanation: 'Two-sum pair at indices 0 and 1.' },
      ],
      hiddenTests: [
        { input: '[3,2,4]\n6', expectedOutput: '[1,2]', explanation: '' },
        { input: '[3,3]\n6', expectedOutput: '[0,1]', explanation: 'Two distinct indices with the same value.' },
      ],
      optimalTime: 'O(N)',
      optimalSpace: 'O(N)',
      hints: [
        'A brute-force O(N^2) check works but is too slow. Can you remember the value you have already seen?',
        'Use a hash map from value to index — for each nums[i], check if target - nums[i] is already in the map.',
      ],
    },
  },
  {
    topic: 'strings',
    difficulty: 'Easy',
    question: {
      title: 'Valid Parentheses',
      slug: 'valid-parentheses',
      difficulty: 'Easy',
      tags: ['Stack', 'Strings'],
      statement:
        'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. An input string is valid if open brackets are closed by the same type of brackets, in the correct order, and every close bracket has a corresponding open bracket of the same type.',
      constraints: '1 <= s.length <= 10^4\ns consists of parentheses only.',
      examples: [
        { input: 's = "()"', output: 'true', explanation: 'Open then close of the same type.' },
        { input: 's = "()[]{}"', output: 'true', explanation: '' },
        { input: 's = "(]"', output: 'false', explanation: 'Mismatched bracket type.' },
      ],
      starterCode: {
        javascript:
          '/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n  // your code here\n};\n',
      },
      publicTests: [
        { input: '"()"', expectedOutput: 'true', explanation: '' },
        { input: '"(]"', expectedOutput: 'false', explanation: '' },
      ],
      hiddenTests: [
        { input: '"([)]"', expectedOutput: 'false', explanation: 'Brackets interleave incorrectly.' },
        { input: '"{[]}"', expectedOutput: 'true', explanation: '' },
      ],
      optimalTime: 'O(N)',
      optimalSpace: 'O(N)',
      hints: [
        'Use a stack: push openers, pop on closers and verify the match.',
        'At the end, the stack must be empty.',
      ],
    },
  },
  {
    topic: 'arrays',
    difficulty: 'Medium',
    question: {
      title: 'Merge Intervals',
      slug: 'merge-intervals',
      difficulty: 'Medium',
      tags: ['Arrays', 'Sorting'],
      statement:
        'Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the input intervals.',
      constraints: '1 <= intervals.length <= 10^4\nintervals[i].length == 2\n0 <= start_i <= end_i <= 10^4',
      examples: [
        { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: 'Intervals [1,3] and [2,6] overlap, merged into [1,6].' },
      ],
      starterCode: {
        javascript:
          '/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n  // your code here\n};\n',
      },
      publicTests: [
        { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]', explanation: '' },
      ],
      hiddenTests: [
        { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]', explanation: 'Touching intervals are merged.' },
        { input: '[[1,4],[0,4]]', expectedOutput: '[[0,4]]', explanation: '' },
      ],
      optimalTime: 'O(N log N)',
      optimalSpace: 'O(N)',
      hints: [
        'Sort by start time first.',
        'Iterate, and merge when the next interval starts before the current one ends.',
      ],
    },
  },
  {
    topic: 'design',
    difficulty: 'Medium',
    question: {
      title: 'LRU Cache',
      slug: 'lru-cache',
      difficulty: 'Medium',
      tags: ['Design', 'Hashing', 'Linked List'],
      statement:
        'Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**. Implement the `LRUCache` class with `get(key)` returning the value if it exists (else -1) and marking it as recently used, and `put(key, value)` updating or inserting the value. When the cache reaches its capacity, it should evict the least recently used key. Both operations must run in **O(1)** average time.',
      constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 calls will be made to get and put.',
      examples: [
        {
          input: 'capacity = 2; put(1,1); put(2,2); get(1); put(3,3); get(2); put(4,4); get(1); get(3); get(4)',
          output: '[1,-1,-1,3,4]',
          explanation: 'Eviction order shows the LRU policy at each step.',
        },
      ],
      starterCode: {
        javascript:
          '/**\n * @param {number} capacity\n */\nvar LRUCache = function(capacity) {\n  // your code here\n};\n\n/** \n * @param {number} key\n * @return {number}\n */\nLRUCache.prototype.get = function(key) {\n  // your code here\n};\n\n/** \n * @param {number} key \n * @param {number} value\n * @return {void}\n */\nLRUCache.prototype.put = function(key, value) {\n  // your code here\n};\n',
      },
      publicTests: [
        { input: '2|put(1,1)|put(2,2)|get(1)|put(3,3)|get(2)', expectedOutput: '1|-1', explanation: '' },
      ],
      hiddenTests: [
        { input: '1|put(2,1)|get(2)|put(3,2)|get(2)|get(3)', expectedOutput: '1|-1|2', explanation: '' },
      ],
      optimalTime: 'O(1)',
      optimalSpace: 'O(capacity)',
      hints: [
        'A Map in JavaScript already preserves insertion order — use it for the O(1) get/put operations.',
        'On get/put, delete + re-set the key so it becomes the most recently used.',
      ],
    },
  },
  {
    topic: 'strings',
    difficulty: 'Medium',
    question: {
      title: 'Longest Substring Without Repeating Characters',
      slug: 'longest-substring-without-repeating',
      difficulty: 'Medium',
      tags: ['Sliding Window', 'Strings', 'Hashing'],
      statement:
        'Given a string `s`, find the length of the **longest substring** without repeating characters.',
      constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols, and spaces.',
      examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc" with length 3.' },
        { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b" with length 1.' },
      ],
      starterCode: {
        javascript:
          '/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n  // your code here\n};\n',
      },
      publicTests: [
        { input: '"abcabcbb"', expectedOutput: '3', explanation: '' },
        { input: '"bbbbb"', expectedOutput: '1', explanation: '' },
      ],
      hiddenTests: [
        { input: '"pwwkew"', expectedOutput: '3', explanation: 'Answer is "wke" (or "kew").' },
        { input: '""', expectedOutput: '0', explanation: '' },
      ],
      optimalTime: 'O(N)',
      optimalSpace: 'O(min(N, alphabet))',
      hints: [
        'Maintain a sliding window with two pointers + a Set of in-window characters.',
        'When a duplicate is encountered, shrink the window from the left until the duplicate is gone.',
      ],
    },
  },
  {
    topic: 'graphs',
    difficulty: 'Hard',
    question: {
      title: 'Word Ladder',
      slug: 'word-ladder',
      difficulty: 'Hard',
      tags: ['BFS', 'Graphs', 'Strings'],
      statement:
        'Given two words `beginWord` and `endWord`, and a dictionary `wordList`, return the **number of words** in the shortest transformation sequence from `beginWord` to `endWord` where each transformed word must exist in `wordList`, and only one letter can be changed at a time. Return `0` if no such sequence exists.',
      constraints: '1 <= beginWord.length <= 10\nendWord.length == beginWord.length\n1 <= wordList.length <= 5000\nAll words consist of lowercase English letters.',
      examples: [
        { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: 'Shortest: hit -> hot -> dot -> dog -> cog.' },
      ],
      starterCode: {
        javascript:
          '/**\n * @param {string} beginWord\n * @param {string} endWord\n * @param {string[]} wordList\n * @return {number}\n */\nvar ladderLength = function(beginWord, endWord, wordList) {\n  // your code here\n};\n',
      },
      publicTests: [
        { input: '"hit"|"cog"|["hot","dot","dog","lot","log","cog"]', expectedOutput: '5', explanation: '' },
      ],
      hiddenTests: [
        { input: '"hit"|"cog"|["hot","dot","dog","lot","log"]', expectedOutput: '0', explanation: 'endWord not in wordList.' },
      ],
      optimalTime: 'O(N * M^2)',
      optimalSpace: 'O(N * M^2)',
      hints: [
        'BFS from beginWord gives the shortest path in this unweighted graph.',
        'Generate intermediate wildcard words ("h*t") to precompute adjacency in O(M) per word.',
      ],
    },
  },
];

// Pick the closest matching local question by topic keyword + difficulty.
// Falls back to a generic "Arrays / Easy" entry if nothing matches.
function localGenerateQuestion({ topic, difficulty, type }) {
  const t = (topic || '').toLowerCase();
  // Score each bank entry by how well it matches topic + difficulty.
  let best = null;
  let bestScore = -1;
  for (const entry of QUESTION_BANK) {
    let score = 0;
    if (t.includes(entry.topic)) score += 2;
    if (entry.difficulty === difficulty) score += 3;
    else if (entry.difficulty === 'Medium') score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  // If nothing matched at all, default to Two Sum.
  if (!best) best = QUESTION_BANK[0];
  const q = best.question;
  // If the requested difficulty differs, override it (but keep everything else).
  if (difficulty && q.difficulty !== difficulty) {
    q.difficulty = difficulty;
  }
  // Stash the requested type as a hint (the Question model doesn't have a `type`
  // field — we keep it in tags for now).
  if (type && type !== 'coding' && !q.tags.includes(type)) {
    q.tags = [...q.tags, type];
  }
  // Deep clone so the bank entry isn't mutated across calls.
  return JSON.parse(JSON.stringify(q));
}

// Coerce an LLM-generated question object into the strict Question schema.
// Returns the fallback if any structural validation fails — never throws.
function coerceQuestion(input, { topic, difficulty, type, fallback }) {
  if (!input || typeof input !== 'object') return fallback;
  const out = { ...fallback, ...input };
  // Title
  if (typeof out.title !== 'string' || out.title.trim().length < 3) {
    out.title = fallback.title;
  } else {
    out.title = out.title.trim().slice(0, 200);
  }
  // Slug — slug-safe lowercase + dashes only. We DON'T add a random suffix
  // here; the controller does that after a duplicate check against the org.
  let slug = typeof out.slug === 'string' ? out.slug.toLowerCase().trim() : fallback.slug;
  slug = slug.replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!/^[a-z0-9-]+$/.test(slug) || slug.length < 1) slug = fallback.slug;
  out.slug = slug.slice(0, 80);
  // Difficulty — must be one of DIFFICULTY_VALUES.
  if (!DIFFICULTY_VALUES.includes(out.difficulty)) out.difficulty = difficulty || 'Medium';
  // Tags
  if (!Array.isArray(out.tags)) out.tags = fallback.tags;
  else out.tags = out.tags.filter((t) => typeof t === 'string' && t.length).slice(0, 20);
  // Statement
  if (typeof out.statement !== 'string' || out.statement.trim().length < 10) {
    out.statement = fallback.statement;
  }
  // Constraints
  if (typeof out.constraints !== 'string') out.constraints = '';
  // Examples
  if (!Array.isArray(out.examples)) out.examples = fallback.examples;
  else
    out.examples = out.examples
      .filter((e) => e && typeof e === 'object')
      .map((e) => ({
        input: String(e.input ?? ''),
        output: String(e.output ?? ''),
        explanation: String(e.explanation ?? ''),
      }))
      .filter((e) => e.input && e.output)
      .slice(0, 8);
  // Starter code
  if (!out.starterCode || typeof out.starterCode !== 'object') {
    out.starterCode = fallback.starterCode;
  } else {
    // Ensure each starter-code language is a string.
    const sc = {};
    for (const lang of ['javascript', 'python', 'java', 'cpp']) {
      if (typeof out.starterCode[lang] === 'string') sc[lang] = out.starterCode[lang];
    }
    if (!sc.javascript) sc.javascript = fallback.starterCode.javascript || '';
    out.starterCode = sc;
  }
  // Validate tests: input + expectedOutput must each be a parseable JSON string.
  // If they aren't, we drop that test rather than failing the whole response.
  function cleanTests(list) {
    if (!Array.isArray(list)) return [];
    return list
      .filter((t) => t && typeof t === 'object')
      .map((t) => ({
        input: String(t.input ?? ''),
        expectedOutput: String(t.expectedOutput ?? ''),
        explanation: String(t.explanation ?? ''),
      }))
      .filter((t) => t.input && t.expectedOutput)
      .slice(0, 20);
  }
  out.publicTests = cleanTests(out.publicTests);
  out.hiddenTests = cleanTests(out.hiddenTests);
  if (out.publicTests.length === 0) out.publicTests = fallback.publicTests;
  if (out.hiddenTests.length === 0) out.hiddenTests = fallback.hiddenTests;
  // Optimal complexity strings
  if (typeof out.optimalTime !== 'string') out.optimalTime = fallback.optimalTime;
  if (typeof out.optimalSpace !== 'string') out.optimalSpace = fallback.optimalSpace;
  // Hints — non-secret progressive hints.
  if (!Array.isArray(out.hints)) out.hints = fallback.hints;
  else out.hints = out.hints.filter((h) => typeof h === 'string' && h.length).slice(0, 5);
  // Allowed languages — default to javascript.
  if (!Array.isArray(out.allowedLanguages) || out.allowedLanguages.length === 0) {
    out.allowedLanguages = ['javascript'];
  }
  // Time / memory limits
  if (typeof out.timeLimitMs !== 'number' || out.timeLimitMs < 50) out.timeLimitMs = 2000;
  if (typeof out.memoryLimitMb !== 'number' || out.memoryLimitMb < 8) out.memoryLimitMb = 256;
  // Stash the requested topic/type for debugging (NOT persisted to the model —
  // only kept on the preview object so the controller can audit / log).
  out._aiMeta = { topic, type, difficulty: out.difficulty };
  return out;
}

export default {
  analyzeCandidateCode,
  generateAssessmentFromJD,
  generateEvaluationSummary,
  generateFollowupQuestions,
  generateQuestion,
};
