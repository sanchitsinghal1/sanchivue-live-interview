import { z } from 'zod';

// Interview creation wizard — the final payload sent to `POST /interviews`.
// Each step of the wizard validates its slice of the state with the matching
// sub-schema; the full schema below is the union of all steps.
export const interviewDetailsSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  jobRole: z.string().min(2, 'Job role is required.'),
  candidateEmail: z.string().email('Enter a valid candidate email.').or(z.literal('')),
  jobDescription: z.string().min(10, 'Add a brief job description (10+ chars).'),
  requiredSkills: z.array(z.string()).min(1, 'Pick at least one skill.'),
  type: z.enum(['coding', 'system_design', 'behavioral', 'mixed']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  scheduledAt: z.string().min(1, 'Pick a date & time.'),
  timezone: z.string().min(1, 'Timezone is required.'),
  durationMinutes: z.number().int().min(15, 'Minimum 15 minutes.').max(240, 'Maximum 4 hours.'),
  interviewers: z.array(z.string()).min(1, 'Add at least one interviewer.'),
  allowedLanguages: z.array(z.string()).min(1, 'Pick at least one language.'),
  candidateInstructions: z.string().optional().default(''),
  aiPolicy: z.enum(['allowed', 'restricted', 'disabled']).default('restricted'),
  isPublic: z.boolean().default(false),
});

export const interviewQuestionsSchema = z.object({
  questionIds: z.array(z.string()).default([]),
});

export const interviewRubricSchema = z.object({
  // rubricCriteria map: each value 0..10
  rubric: z.record(z.number().min(0).max(10)).default({}),
});

export const interviewCreateSchema = interviewDetailsSchema
  .merge(interviewQuestionsSchema)
  .merge(interviewRubricSchema);

// Test-case shape for the Question Editor.
export const testCaseSchema = z.object({
  input: z.string().default(''),
  expectedOutput: z.string().default(''),
  isHidden: z.boolean().default(false),
  explanation: z.string().optional().default(''),
});

export default interviewCreateSchema;
