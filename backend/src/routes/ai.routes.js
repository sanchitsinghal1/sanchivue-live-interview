// src/routes/ai.routes.js
import { Router } from 'express';
import { copilot, assessment, summary, followups } from '../controllers/ai.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { aiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

router.post('/copilot', aiLimiter, copilot);
router.post('/assessment', aiLimiter, assessment);
router.post('/summary', aiLimiter, summary);
router.post('/followups', aiLimiter, followups);

export default router;
