// src/workers/submissionWorker.js
// Consumes jobs from the submission queue and runs the code execution engine.
// Persists the result on the Submission document and emits a 'completed' event
// the controllers/tests can listen to.
import Submission from '../models/submission.model.js';
import Question from '../models/question.model.js';
import { runCode } from '../services/codeExecution.service.js';
import { submissionQueue } from '../queues/submissionQueue.js';
import { APP_NAME, SUBMISSION_STATUS } from '../config/constants.js';

// The processor takes a job { submissionId } and runs the candidate code against
// the question's tests. We use the kind field ('run' vs 'submit') to decide
// whether to include hidden tests.
export async function processSubmissionJob(job) {
  const data = job?.data || job;
  const submissionId = data.submissionId;
  if (!submissionId) throw new Error('submissionId required');

  const submission = await Submission.findById(submissionId);
  if (!submission) throw new Error(`Submission ${submissionId} not found`);
  if (submission.status !== SUBMISSION_STATUS.PENDING) {
    // Already processed — return the existing result so retries are idempotent.
    return {
      submissionId,
      status: submission.status,
      passedCount: submission.passedCount,
      totalCount: submission.totalCount,
    };
  }

  const question = await Question.findById(submission.questionId).lean();
  if (!question) throw new Error(`Question ${submission.questionId} not found`);

  // Decide which tests to run.
  const tests =
    submission.kind === 'submit'
      ? [...(question.publicTests || []), ...(question.hiddenTests || [])].map((t, i) => ({
          ...t,
          isHidden: i >= (question.publicTests?.length || 0),
        }))
      : (question.publicTests || []).map((t) => ({ ...t, isHidden: false }));

  const result = runCode(
    submission.language,
    submission.code,
    tests,
    question.timeLimitMs,
    question.memoryLimitMb,
  );

  // Persist results back onto the Submission doc.
  const score =
    result.totalCount > 0 ? Math.round((result.passedCount / result.totalCount) * 100) : 0;
  submission.status = result.overallStatus;
  submission.passedCount = result.passedCount;
  submission.totalCount = result.totalCount;
  submission.score = score;
  submission.executionTimeMs = result.executionTimeMs;
  submission.memoryKb = result.memoryKb;
  submission.stdout = (result.stdout || '').slice(0, 50_000);
  submission.stderr = (result.stderr || '').slice(0, 50_000);
  // Strip hidden-test inputs/expected/actual from the result set so a candidate
  // GET /submissions/:id never sees hidden test data — only the verdicts.
  submission.results = (result.results || []).map((r) => ({
    passed: r.passed,
    status: r.status,
    isHidden: !!r.isHidden,
    // For hidden tests we mask input/expected/actual; we keep stdout/stderr so the
    // candidate can see "you printed X" but never see the test definition itself.
    input: r.isHidden ? '' : r.input,
    expected: r.isHidden ? '' : r.expected,
    actual: r.isHidden ? '' : r.actual,
    stdout: r.stdout,
    stderr: r.stderr,
    executionTimeMs: r.executionTimeMs,
    memoryKb: r.memoryKb,
  }));

  await submission.save();

  return {
    submissionId,
    status: submission.status,
    passedCount: submission.passedCount,
    totalCount: submission.totalCount,
    score,
  };
}

// Start the worker — wired differently for BullMQ vs in-memory.
export function startSubmissionWorker() {
  if (submissionQueue.type === 'in-memory') {
    submissionQueue.setProcessor(async (job) => processSubmissionJob(job));
    submissionQueue.on('completed', ({ job: _job, result }) => {
      // `_job` unused — we log only the result for in-memory runs.
      void _job;
      console.log(`[${APP_NAME}] submission ${result.submissionId} → ${result.status}`);
    });
    submissionQueue.on('failed', ({ job, error }) => {
      console.error(
        `[${APP_NAME}] submission ${job?.data?.submissionId} failed:`,
        error?.message || error,
      );
    });
    return;
  }
  // BullMQ path.
  (async () => {
    const { Worker } = await import('bullmq');
    const { env } = await import('../config/env.js');
    const worker = new Worker('sanchivue-submissions', async (job) => processSubmissionJob(job), {
      connection: { url: env.REDIS_URL, maxRetriesPerRequest: null },
      concurrency: 2,
    });
    worker.on('completed', (job) => {
      console.log(`[${APP_NAME}] submission ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
      console.error(`[${APP_NAME}] submission ${job?.id} failed:`, err.message);
    });
    // Wire our own on() handlers from the queue module (for controllers that
    // want to listen).
    const handlers = submissionQueue._handlers || {};
    if (handlers.completed) {
      worker.on('completed', (job) => handlers.completed.forEach((h) => h(job)));
    }
    if (handlers.failed) {
      worker.on('failed', (job, err) => handlers.failed.forEach((h) => h(job, err)));
    }
  })();
}

export default { processSubmissionJob, startSubmissionWorker };
