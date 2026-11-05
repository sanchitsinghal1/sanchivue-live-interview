// src/validators/template.validator.js
// Zod schemas for InterviewTemplate CRUD — mirrors interviewTemplate.model.js.
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../config/constants.js';

export const createTemplateSchema = z.object({
  orgId: z.string().length(24).optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional(),
  questionIds: z.array(z.string().length(24)).default([]),
  jobRole: z.string().max(120).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  type: z.enum(['CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'MIXED']).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  allowedLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).optional(),
  rubric: z
    .object({
      problemSolving: z.number().min(0).max(10).optional(),
      correctness: z.number().min(0).max(10).optional(),
      codeQuality: z.number().min(0).max(10).optional(),
      communication: z.number().min(0).max(10).optional(),
      debugging: z.number().min(0).max(10).optional(),
      testing: z.number().min(0).max(10).optional(),
      design: z.number().min(0).max(10).optional(),
      complexity: z.number().min(0).max(10).optional(),
    })
    .optional(),
});

export const updateTemplateSchema = createTemplateSchema.partial();
