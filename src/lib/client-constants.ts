// Frontend constants (kept separate from backend src/lib/constants.ts so this
// file can be imported safely from client components).
export const COLLAB_PORT = 3003;

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", monacoId: "javascript" },
  { id: "python", label: "Python", monacoId: "python" },
  { id: "java", label: "Java", monacoId: "java" },
  { id: "cpp", label: "C++", monacoId: "cpp" },
] as const;

export const MONACO_THEME = "vs-dark";

export const RUBRIC_CRITERIA = [
  {
    key: "problemSolving",
    label: "Problem Solving",
    description: "Approach correctness, decomposition, algorithmic thinking.",
  },
  {
    key: "cleanCode",
    label: "Clean Code",
    description: "Naming, structure, readability, maintainability.",
  },
  {
    key: "optimization",
    label: "Optimization",
    description: "Time/space complexity awareness and improvement.",
  },
  {
    key: "communication",
    label: "Communication",
    description: "Clarity of thought, explanation of trade-offs.",
  },
  {
    key: "edgeCases",
    label: "Edge Cases",
    description: "Handling of empty inputs, negatives, boundary values.",
  },
] as const;

// Accent colors for collaborator cursor badges, cycled by user.
export const CURSOR_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

export function isInterviewerRole(role: string): boolean {
  return role === "interviewer" || role === "admin";
}

// Demo credentials surfaced on the login screen for instant testing.
export const DEMO_ACCOUNTS = [
  {
    role: "Interviewer",
    email: "interviewer@demo.dev",
    password: "interviewer123",
  },
  {
    role: "Candidate",
    email: "candidate@demo.dev",
    password: "candidate123",
  },
];
