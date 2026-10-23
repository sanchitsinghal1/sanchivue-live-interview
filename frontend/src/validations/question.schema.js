import { z } from 'zod';

// Question bank editor schema.
export const questionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  statement: z.string().min(20, 'Statement must be at least 20 characters.'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
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
  timeLimitMs: z.number().int().min(100).default(2000),
  memoryLimitMb: z.number().int().min(16).default(256),
});

export default questionSchema;
