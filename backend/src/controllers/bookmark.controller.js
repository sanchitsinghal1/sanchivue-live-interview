// src/controllers/bookmark.controller.js
// Bookmark CRUD: list (paginated, hiddenTests stripped), toggle (create-or-delete
// idempotent), isBookmarked (cheap lookup for the card icon's initial state).
// All routes require verifyJWT (enforced in bookmark.routes.js) so req.user is
// always populated. We scope every read by req.user._id so users only see their
// own bookmarks.
import Bookmark from '../models/bookmark.model.js';
import Question from '../models/question.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getPagination, paginateQuery } from '../utils/pagination.js';

// Helper — projects the question fields a candidate/interviewer is allowed to
// see on a bookmark card. Hidden tests are NEVER included.
const QUESTION_PROJECTION = {
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
  createdBy: 1,
  orgId: 1,
  isArchived: 1,
  createdAt: 1,
  updatedAt: 1,
};

// GET /api/v1/bookmarks — paginated list of the caller's bookmarked questions.
// Hidden tests are stripped via the projection above. Honors `?orgId` to scope
// to a specific org's bookmarks (useful when a user belongs to multiple orgs).
export const listBookmarks = asyncHandler(async (req, res) => {
  const { page, limit } = getPagination(req);
  const filter = { userId: req.user._id };
  if (req.query.orgId) filter.orgId = req.query.orgId;
  const result = await paginateQuery(
    Bookmark,
    filter,
    { page, limit },
    [
      {
        path: 'questionId',
        select: QUESTION_PROJECTION,
      },
    ],
  );
  // Drop any bookmark whose underlying question was hard-deleted (extremely
  // rare since we soft-archive, but defensive). Also drop archived questions
  // unless the caller explicitly asks for them via `?includeArchived=true`.
  const filteredItems = result.items.filter((b) => {
    if (!b.questionId) return false;
    if (b.questionId.isArchived && req.query.includeArchived !== 'true') return false;
    return true;
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: filteredItems,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
      'Bookmarks',
    ),
  );
});

// POST /api/v1/bookmarks/:questionId — toggle (idempotent).
// Creates a bookmark if absent, deletes it if present. Returns { bookmarked }.
export const toggleBookmark = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  if (!questionId) throw new ApiError(400, 'questionId is required.');
  // Verify the question exists (and isn't archived) so users can't bookmark
  // a phantom or soft-deleted question.
  const question = await Question.findById(questionId).lean();
  if (!question) throw new ApiError(404, 'Question not found.');
  // Look up an existing bookmark by (userId, questionId). The compound unique
  // index guarantees at most one.
  const existing = await Bookmark.findOne({
    userId: req.user._id,
    questionId: question._id,
  });
  if (existing) {
    await Bookmark.deleteOne({ _id: existing._id });
    return res
      .status(200)
      .json(new ApiResponse(200, { bookmarked: false }, 'Bookmark removed'));
  }
  await Bookmark.create({
    userId: req.user._id,
    questionId: question._id,
    orgId: question.orgId,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, { bookmarked: true }, 'Bookmark added'));
});

// GET /api/v1/bookmarks/:questionId — cheap lookup used by the frontend's
// bookmark icon to render its initial filled/outline state on a single card.
export const isBookmarked = asyncHandler(async (req, res) => {
  const { questionId } = req.params;
  if (!questionId) throw new ApiError(400, 'questionId is required.');
  const existing = await Bookmark.exists({
    userId: req.user._id,
    questionId,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bookmarked: !!existing },
        existing ? 'Bookmarked' : 'Not bookmarked',
      ),
    );
});

export default { listBookmarks, toggleBookmark, isBookmarked };
