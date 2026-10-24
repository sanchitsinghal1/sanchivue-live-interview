// src/routes/evaluation.routes.js
import { Router } from 'express';
import { getEvaluation, upsertEvaluation } from '../controllers/evaluation.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

router.get('/:interviewId', getEvaluation);
router.put('/:interviewId', upsertEvaluation);

export default router;
