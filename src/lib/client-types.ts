import type {
  PublicUser,
  TestCase,
  StarterCode,
  Example,
  RunResult,
  CodeSnapshot,
  ProctoringLog,
  ChatMessage,
  RubricScores,
} from "@/lib/types";

// Frontend mirror of backend domain shapes used across the UI.
export type {
  PublicUser,
  TestCase,
  StarterCode,
  Example,
  RunResult,
  CodeSnapshot,
  ProctoringLog,
  ChatMessage,
  RubricScores,
};

export interface QuestionListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  statement: string;
  constraints: string;
  examples: Example[];
  optimalTime: string;
  optimalSpace: string;
  starterCode: StarterCode;
  publicTests: TestCase[];
  hiddenTests: TestCase[];
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface InterviewListItem {
  id: string;
  roomCode: string;
  status: string;
  candidate: { id: string; name: string; email: string } | null;
  interviewer: { id: string; name: string; email: string } | null;
  question: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  } | null;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface CopilotInsight {
  complexity: { time: string; space: string };
  bugs: string[];
  edgeCases: string[];
  followUpQuestions: string[];
  hint: string;
}

export interface AssessmentBlueprint {
  title: string;
  summary: string;
  recommendedTopics: string[];
  questions: Array<{
    title: string;
    difficulty: string;
    tags: string[];
    statement: string;
    optimalTime: string;
    optimalSpace: string;
    starterCode: string;
    publicTests: TestCase[];
    hiddenTests: TestCase[];
  }>;
  rubricWeights: Record<string, number>;
}

export type AppView =
  | "landing"
  | "login"
  | "register"
  | "dashboard"
  | "question-bank"
  | "jd-builder"
  | "interview-room"
  | "evaluation";

export interface PresenceUser {
  userId: string;
  userName: string;
  role: string;
}
