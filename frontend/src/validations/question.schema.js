import { z } from 'zod';

// Question bank editor schema.
// NOTE: difficulty is intentionally case-insensitive here — the existing Select
// uses capitalized option values ('Easy'/'Medium'/'Hard' from DIFFICULTY_LABELS)
// while earlier versions of this schema only accepted lowercase. Accepting both
// keeps the existing UI working AND lets the AI generator (which returns the
// backend's canonical 'Easy'/'Medium'/'Hard' values) hydrate the form without
// a case-conversion hop. The submit handler capitalizes before sending.
export const questionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  slug: z
    .string()
    .min(1, 'Slug is required.')
    .max(80, 'Slug must be 80 chars or fewer.')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase + dashes only.')
    .optional()
    .or(z.literal('')),
  statement: z.string().min(20, 'Statement must be at least 20 characters.'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()).default([]),
  type: z.enum(['coding', 'system_design', 'behavioral']).default('coding'),
  allowedLanguages: z.array(z.string()).min(1, 'Pick at least one language.'),
  starterCode: z.record(z.string()).default({}),
  publicTests: z
    .array(
      z.object({
        input: z.string().default(''),
        expectedOutput: z.string().default(''),
        explanation: z.string().optional().default(''),
      }),
    )
    .default([]),
  hiddenTests: z
    .array(
      z.object({
        input: z.string().default(''),
        expectedOutput: z.string().default(''),
        explanation: z.string().optional().default(''),
      }),
    )
    .default([]),
  // New fields surfaced for the AI Question flow + Hints deliverable.
  constraints: z.string().default('').optional(),
  examples: z
    .array(
      z.object({
        input: z.string().default(''),
        output: z.string().default(''),
        explanation: z.string().optional().default(''),
      }),
    )
    .default([]),
  optimalTime: z.string().max(40).default('').optional(),
  optimalSpace: z.string().max(40).default('').optional(),
  hints: z.array(z.string().max(500)).max(10).default([]),
  timeLimitMs: z.number().int().min(100).default(2000),
  memoryLimitMb: z.number().int().min(16).default(256),
});

export default questionSchema;
