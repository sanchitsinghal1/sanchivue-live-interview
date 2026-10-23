// src/routes/index.routes.js
// Mounts every sub-router under /api/v1. Keeps server.js / app.js clean.
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import organizationRoutes from './organization.routes.js';
import interviewRoutes from './interview.routes.js';
import questionRoutes from './question.routes.js';
import submissionRoutes from './submission.routes.js';
import evaluationRoutes from './evaluation.routes.js';
import notificationRoutes from './notification.routes.js';
import aiRoutes from './ai.routes.js';
import { API_PREFIX } from '../config/constants.js';

const router = Router();

// Mount every router under /api/v1/<resource>.
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/organizations`, organizationRoutes);
router.use(`${API_PREFIX}/interviews`, interviewRoutes);
router.use(`${API_PREFIX}/questions`, questionRoutes);
router.use(`${API_PREFIX}/submissions`, submissionRoutes);
router.use(`${API_PREFIX}/evaluations`, evaluationRoutes);
router.use(`${API_PREFIX}/notifications`, notificationRoutes);
router.use(`${API_PREFIX}/ai`, aiRoutes);

export default router;
