// src/routes/bookmark.routes.js
// User-scoped bookmark routes. All require verifyJWT (the question being
// bookmarked is resolved + existence-checked inside the toggle handler, so we
// don't need a separate org-access middleware here — bookmarks are per-user
// regardless of org).
import { Router } from 'express';
import {
  listBookmarks,
  toggleBookmark,
  isBookmarked,
} from '../controllers/bookmark.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

// Collection route — list the caller's bookmarks (paginated, hidden tests stripped).
router.get('/', listBookmarks);

// Single-question bookmark actions. The order matters: GET (status check)
// and POST (toggle) on the same path. Express routes are matched in declaration
// order, but since the methods differ, they don't collide.
router.get('/:questionId', isBookmarked);
router.post('/:questionId', toggleBookmark);

export default router;
