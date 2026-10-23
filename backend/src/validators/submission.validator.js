// src/validators/submission.validator.js
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../config/constants.js';

export const runCodeSchema = z.object({
  orgId: z.string().length(24).optional(),
  questionId: z.string().length(24),
  interviewId: z.string().length(24).optional(),
  language: z.enum(SUPPORTED_LANGUAGES),
  code: z.string().min(1).max(200000),
  // Optional override of the question's default limits.
  timeLimitMs: z.number().int().min(50).max(30000).optional(),
  memoryLimitMb: z.number().int().min(8).max(2048).optional(),
});

export const submitCodeSchema = runCodeSchema;
