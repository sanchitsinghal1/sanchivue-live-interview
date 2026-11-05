// src/validators/question.validator.js
import { z } from 'zod';
import { DIFFICULTY_VALUES, SUPPORTED_LANGUAGES } from '../config/constants.js';

const testCaseSchema = z.object({
  input: z.string().min(1),
  expectedOutput: z.string().min(1),
  explanation: z.string().optional(),
  weight: z.number().min(0).optional(),
});

const exampleSchema = z.object({
  input: z.string().min(1),
  output: z.string().min(1),
  explanation: z.string().optional(),
});

const starterCodeSchema = z.object({
  javascript: z.string().optional(),
  python: z.string().optional(),
  java: z.string().optional(),
  cpp: z.string().optional(),
});

export const createQuestionSchema = z.object({
  orgId: z.string().length(24).optional(), // may come from params
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase + dashes only'),
  difficulty: z.enum(DIFFICULTY_VALUES).optional(),
  tags: z.array(z.string().max(60)).max(20).default([]),
  statement: z.string().min(1).max(20000),
  constraints: z.string().max(5000).optional(),
  examples: z.array(exampleSchema).default([]),
  starterCode: starterCodeSchema.optional(),
  publicTests: z.array(testCaseSchema).default([]),
  hiddenTests: z.array(testCaseSchema).default([]),
  optimalTime: z.string().max(40).optional(),
  optimalSpace: z.string().max(40).optional(),
  // Progressive hints shown to candidates (NOT secret).
  hints: z.array(z.string().max(500)).max(10).default([]),
  timeLimitMs: z.number().int().min(50).max(30000).optional(),
  memoryLimitMb: z.number().int().min(8).max(2048).optional(),
  allowedLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();
