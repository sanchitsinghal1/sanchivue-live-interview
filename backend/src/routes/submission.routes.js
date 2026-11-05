// src/routes/submission.routes.js
import { Router } from 'express';
import {
  runCodeHandler,
  submitCodeHandler,
  getSubmission,
  listSubmissions,
} from '../controllers/submission.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { submitLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { runCodeSchema, submitCodeSchema } from '../validators/submission.validator.js';

const router = Router();

// All routes require authentication.
router.use(verifyJWT);

router.post('/run', submitLimiter, validate(runCodeSchema), runCodeHandler);
router.post('/submit', submitLimiter, validate(submitCodeSchema), submitCodeHandler);

router.get('/history', listSubmissions);
router.get('/:id', getSubmission);

export default router;
