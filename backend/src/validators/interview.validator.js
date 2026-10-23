// src/validators/interview.validator.js
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from '../config/constants.js';

export const createInterviewSchema = z.object({
  orgId: z.string().length(24).optional(), // may come from params
  title: z.string().min(1).max(200),
  jobRole: z.string().max(120).optional(),
  candidateEmail: z.string().email().optional(),
  candidateName: z.string().max(120).optional(),
  candidateUserId: z.string().length(24).optional(),
  interviewerIds: z.array(z.string().length(24)).default([]),
  questionIds: z.array(z.string().length(24)).default([]),
  templateId: z.string().length(24).optional(),
  type: z.enum(['CODING', 'SYSTEM_DESIGN', 'BEHAVIORAL', 'MIXED']).optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  scheduledAt: z.string().datetime().optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  timezone: z.string().max(80).optional(),
  allowedLanguages: z.array(z.enum(SUPPORTED_LANGUAGES)).optional(),
  aiPolicy: z.enum(['allowed', 'hint-only', 'disabled']).optional(),
  instructions: z.string().max(8000).optional(),
});

export const updateInterviewSchema = createInterviewSchema.partial();

export const transitionStatusSchema = z.object({
  status: z.enum([
    'DRAFT',
    'SCHEDULED',
    'READY',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'EXPIRED',
  ]),
});

export const appendProctoringSchema = z.object({
  appendProctoring: z.object({
    type: z.enum(['tab-switch', 'window-blur', 'paste-anomaly', 'fullscreen-exit', 'idle']),
    severity: z.enum(['low', 'medium', 'high']).optional(),
    detail: z.string().max(500).optional(),
    timestamp: z.string().datetime().optional(),
  }),
});

export const appendChatSchema = z.object({
  appendChat: z.object({
    body: z.string().min(1).max(2000),
    timestamp: z.string().datetime().optional(),
  }),
});

export const appendSnapshotSchema = z.object({
  appendSnapshot: z.object({
    code: z.string().max(200000).optional(),
    language: z.enum(SUPPORTED_LANGUAGES).optional(),
    eventType: z.enum(['auto', 'run', 'submit']).optional(),
    timestamp: z.string().datetime().optional(),
  }),
});

export const updateRubricDraftSchema = z.object({
  rubricDraft: z.object({
    problemSolving: z.number().min(0).max(10).optional(),
    correctness: z.number().min(0).max(10).optional(),
    codeQuality: z.number().min(0).max(10).optional(),
    communication: z.number().min(0).max(10).optional(),
    debugging: z.number().min(0).max(10).optional(),
    testing: z.number().min(0).max(10).optional(),
    design: z.number().min(0).max(10).optional(),
    complexity: z.number().min(0).max(10).optional(),
  }),
});

export const assignQuestionSchema = z.object({
  questionIds: z.array(z.string().length(24)).min(1),
});
