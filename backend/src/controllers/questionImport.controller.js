// src/controllers/questionImport.controller.js
// Question bank import / export as JSON.
//   - GET  /api/v1/questions/export        → downloads the org's non-archived
//                                              questions as a JSON array
//                                              (hiddenTests included only for
//                                              interviewer+).
//   - POST /api/v1/questions/import         → accepts { questions: [...] },
//                                              validates each, dedupes by
//                                              (orgId, slug), and returns
//                                              { imported, skipped, errors[] }.
//
// Both routes require org membership + (orgOwner | orgAdmin | interviewer) and
// are mounted in question.routes.js BEFORE the /:id route so they aren't
// captured by the param route.
import Question from '../models/question.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AuditService } from '../services/audit.service.js';
import { createQuestionSchema } from '../validators/question.validator.js';
import { USER_ROLES } from '../config/constants.js';

// Roles that may see hiddenTests in an export (interviewer+ platform or org role).
const INTERVIEWER_ORG_ROLES = new Set(['orgOwner', 'orgAdmin', 'recruiter', 'interviewer']);

// Returns true if the requester is allowed to see hidden tests for this org.
function canSeeHiddenTests(req) {
  if (req.user?.role === USER_ROLES.ADMIN) return true;
  if (!req.membership) return false;
  return INTERVIEWER_ORG_ROLES.has(req.membership.role);
}

// GET /api/v1/questions/export?orgId=...
// Streams a JSON file as an attachment. Filename includes the org id + a
// timestamp so repeated exports don't overwrite each other.
export const exportQuestions = asyncHandler(async (req, res) => {
  const orgId = req.query.orgId || req.orgId;
  if (!orgId) throw new ApiError(400, 'orgId is required.');
  const includeHidden = canSeeHiddenTests(req);
  // Lean projection — exclude archived questions. We also exclude __v via the
  // model's toJSON transform implicitly (lean doesn't run toJSON, so we strip
  // __v explicitly here).
  const projection = {
    _id: 1,
    title: 1,
    slug: 1,
    difficulty: 1,
    tags: 1,
    statement: 1,
    constraints: 1,
    examples: 1,
    starterCode: 1,
    publicTests: 1,
    optimalTime: 1,
    optimalSpace: 1,
    timeLimitMs: 1,
    memoryLimitMb: 1,
    allowedLanguages: 1,
    hints: 1,
    isArchived: 1,
    createdAt: 1,
    updatedAt: 1,
  };
  if (includeHidden) projection.hiddenTests = 1;
  const docs = await Question.find({ orgId, isArchived: false })
    .select(projection)
    .lean();
  // Strip __v from each doc (lean() doesn't apply toJSON transform).
  const clean = docs.map((d) => {
    const { __v, ...rest } = d;
    return rest;
  });
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `sanchivue-questions-${orgId.toString().slice(-6)}-${stamp}.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // Wrap in the standard ApiResponse envelope so the frontend can read
  // `data.questions` consistently, but the Content-Disposition header still
  // triggers a browser download.
  return res
    .status(200)
    .json(new ApiResponse(200, { questions: clean, count: clean.length }, 'Questions exported'));
});

// POST /api/v1/questions/import
// Body: { orgId?, questions: [...] }
// Validates each entry against createQuestionSchema (the same Zod schema used
// by createQuestion), dedupes by (orgId, slug) — skips existing slugs in this
// org — and creates the rest in bulk. Returns { imported, skipped, errors[] }.
export const importQuestions = asyncHandler(async (req, res) => {
  const orgId = req.body.orgId || req.orgId;
  if (!orgId) throw new ApiError(400, 'orgId is required.');
  const { questions } = req.body;
  if (!Array.isArray(questions)) {
    throw new ApiError(400, '`questions` must be an array.');
  }
  if (questions.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { imported: 0, skipped: 0, errors: [] }, 'Nothing to import'));
  }
  if (questions.length > 500) {
    throw new ApiError(400, 'Cannot import more than 500 questions at once.');
  }

  // Defensive: resolve existing slugs in this org in one round-trip so we can
  // dedupe without N queries.
  const incomingSlugs = questions
    .map((q) => (typeof q?.slug === 'string' ? q.slug.toLowerCase().trim() : null))
    .filter(Boolean);
  const existingSlugs = new Set();
  if (incomingSlugs.length) {
    const found = await Question.find({ orgId, slug: { $in: incomingSlugs } })
      .select('slug')
      .lean();
    found.forEach((d) => existingSlugs.add(String(d.slug).toLowerCase()));
  }

  const errors = [];
  let imported = 0;
  let skipped = 0;
  const toCreate = [];
  // Track slugs we've already queued in this batch so a duplicate within the
  // payload itself doesn't slip through (only the first wins).
  const seenInBatch = new Set();

  for (let i = 0; i < questions.length; i++) {
    const raw = questions[i];
    const idx = i + 1; // 1-based for error messages.
    if (!raw || typeof raw !== 'object') {
      errors.push({ index: idx, message: 'Entry is not an object.' });
      continue;
    }
    // Force orgId onto the entry so the validator passes + so it lands in this
    // org regardless of what the JSON file says.
    const candidate = { ...raw, orgId };
    // Validate against the create schema. The schema already enforces:
    //   - title (1..200), statement (1..20000), slug (slug-safe)
    //   - difficulty enum, tags[], examples[], starterCode{}, publicTests[],
    //     hiddenTests[], timeLimitMs, memoryLimitMb, allowedLanguages.
    const parsed = createQuestionSchema.safeParse(candidate);
    if (!parsed.success) {
      const msg = parsed.error.issues
        .map((iss) => `${iss.path.join('.') || '_'}: ${iss.message}`)
        .join('; ');
      errors.push({ index: idx, message: msg });
      continue;
    }
    const data = parsed.data;
    // Normalize the slug for the dedupe check.
    const slug = String(data.slug).toLowerCase().trim();
    if (existingSlugs.has(slug)) {
      skipped += 1;
      continue;
    }
    if (seenInBatch.has(slug)) {
      errors.push({
        index: idx,
        message: `Duplicate slug "${slug}" within the import payload.`,
      });
      continue;
    }
    seenInBatch.add(slug);
    toCreate.push({
      ...data,
      orgId,
      createdBy: req.user._id,
    });
  }

  if (toCreate.length) {
    // insertMany with ordered:false so a single failure doesn't abort the whole
    // batch. We catch per-doc errors and surface them in the response.
    try {
      const inserted = await Question.insertMany(toCreate, { ordered: false });
      imported += inserted.length;
      await AuditService.log({
        action: 'QUESTION_IMPORT',
        actor: req.user,
        target: { type: 'Organization', id: orgId },
        meta: { imported: inserted.length, skipped, errors: errors.length },
        ip: req.ip,
      });
    } catch (err) {
      // Mongoose throws a BulkWriteError on partial failure with ordered:false.
      // Successful writes are still persisted; surface per-doc failures.
      if (err?.writeErrors && Array.isArray(err.writeErrors)) {
        err.writeErrors.forEach((we, i) => {
          // we.err.errmsg has the per-doc error message; we.err.op has the doc.
          errors.push({
            index: toCreate[i] ? `(batch#${i + 1})` : '?',
            message: we?.err?.errmsg || we?.message || 'Write failed.',
          });
        });
        // Count successful writes by diffing what we attempted vs. what failed.
        imported += toCreate.length - err.writeErrors.length;
      } else {
        // Hard failure on the whole batch — surface + rethrow as 500.
        throw new ApiError(500, `Import failed: ${err?.message || 'unknown error'}`);
      }
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { imported, skipped, errors },
        `Imported ${imported} question(s); skipped ${skipped}.`,
      ),
    );
});

export default { exportQuestions, importQuestions };
