// Application-wide constants. Co-located in /constants so any component can
// import a single source of truth for languages, roles, rubric, etc.

// --- User roles (match backend enum) ---
export const ROLES = {
  ADMIN: 'admin',
  INTERVIEWER: 'interviewer',
  CANDIDATE: 'candidate',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.INTERVIEWER]: 'Interviewer',
  [ROLES.CANDIDATE]: 'Candidate',
};

// --- Interview lifecycle status ---
export const INTERVIEW_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  ENDED: 'ended',
  CANCELLED: 'cancelled',
};

export const INTERVIEW_STATUS_LABELS = {
  [INTERVIEW_STATUS.DRAFT]: 'Draft',
  [INTERVIEW_STATUS.SCHEDULED]: 'Scheduled',
  [INTERVIEW_STATUS.LIVE]: 'Live',
  [INTERVIEW_STATUS.ENDED]: 'Ended',
  [INTERVIEW_STATUS.CANCELLED]: 'Cancelled',
};

// Tailwind color tokens per status — used by InterviewCard + status badges.
export const INTERVIEW_STATUS_COLORS = {
  [INTERVIEW_STATUS.DRAFT]: 'bg-slate-700 text-slate-200',
  [INTERVIEW_STATUS.SCHEDULED]: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  [INTERVIEW_STATUS.LIVE]: 'bg-brand-emerald/15 text-brand-emerald ring-1 ring-brand-emerald/30',
  [INTERVIEW_STATUS.ENDED]: 'bg-slate-700 text-slate-300',
  [INTERVIEW_STATUS.CANCELLED]: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
};

// --- Question difficulty ---
export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const DIFFICULTY_LABELS = {
  [DIFFICULTY.EASY]: 'Easy',
  [DIFFICULTY.MEDIUM]: 'Medium',
  [DIFFICULTY.HARD]: 'Hard',
};

export const DIFFICULTY_COLORS = {
  [DIFFICULTY.EASY]: 'bg-brand-emerald/15 text-brand-emerald ring-1 ring-brand-emerald/30',
  [DIFFICULTY.MEDIUM]: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  [DIFFICULTY.HARD]: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
};

// --- Interview type ---
export const INTERVIEW_TYPE = {
  CODING: 'coding',
  SYSTEM_DESIGN: 'system_design',
  BEHAVIORAL: 'behavioral',
  MIXED: 'mixed',
};

export const INTERVIEW_TYPE_LABELS = {
  [INTERVIEW_TYPE.CODING]: 'Coding',
  [INTERVIEW_TYPE.SYSTEM_DESIGN]: 'System Design',
  [INTERVIEW_TYPE.BEHAVIORAL]: 'Behavioral',
  [INTERVIEW_TYPE.MIXED]: 'Mixed',
};

// --- Languages supported by the sandboxed runner + Monaco ---
// `id` is the value sent to the backend; `monaco` is what we tell Monaco to use.
export const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', monaco: 'javascript', icon: 'JS' },
  { id: 'typescript', label: 'TypeScript', monaco: 'typescript', icon: 'TS' },
  { id: 'python', label: 'Python', monaco: 'python', icon: 'PY' },
  { id: 'java', label: 'Java', monaco: 'java', icon: 'JV' },
  { id: 'cpp', label: 'C++', monaco: 'cpp', icon: 'C+' },
  { id: 'c', label: 'C', monaco: 'c', icon: 'C' },
  { id: 'go', label: 'Go', monaco: 'go', icon: 'GO' },
  { id: 'rust', label: 'Rust', monaco: 'rust', icon: 'RS' },
];

export const LANGUAGE_LABELS = LANGUAGES.reduce((acc, l) => {
  acc[l.id] = l.label;
  return acc;
}, {});

// --- Rubric criteria for the interactive evaluation scorecard ---
export const RUBRIC_CRITERIA = [
  {
    key: 'problemSolving',
    label: 'Problem Solving',
    description: 'Approach, decomposition, algorithm choice.',
  },
  {
    key: 'cleanCode',
    label: 'Clean Code',
    description: 'Naming, structure, readability, idiomatic style.',
  },
  {
    key: 'optimization',
    label: 'Optimization',
    description: 'Time/space complexity and trade-off awareness.',
  },
  {
    key: 'communication',
    label: 'Communication',
    description: 'Clarity of thought, asking clarifying questions.',
  },
  {
    key: 'edgeCases',
    label: 'Edge Cases',
    description: 'Boundary conditions, error handling, robustness.',
  },
];

export const RUBRIC_MAX = 10; // per-criterion max score
export const RUBRIC_TOTAL_MAX = RUBRIC_CRITERIA.length * RUBRIC_MAX;

// --- Proctoring violation types ---
export const PROCTORING_TYPES = {
  TAB_SWITCH: 'tab-switch',
  WINDOW_BLUR: 'window-blur',
  PASTE_ANOMALY: 'paste-anomaly',
  FULLSCREEN_EXIT: 'fullscreen-exit',
};

export const PROCTORING_LABELS = {
  [PROCTORING_TYPES.TAB_SWITCH]: 'Tab Switch',
  [PROCTORING_TYPES.WINDOW_BLUR]: 'Window Blur',
  [PROCTORING_TYPES.PASTE_ANOMALY]: 'Paste Anomaly',
  [PROCTORING_TYPES.FULLSCREEN_EXIT]: 'Fullscreen Exit',
};

// --- Pagination defaults ---
export const DEFAULT_PAGE_SIZE = 10;

// --- Demo credentials surfaced on the login page ---
export const DEMO_ACCOUNTS = [
  {
    label: 'Interviewer',
    email: 'interviewer@demo.dev',
    password: 'interviewer123',
    role: ROLES.INTERVIEWER,
  },
  {
    label: 'Candidate',
    email: 'candidate@demo.dev',
    password: 'candidate123',
    role: ROLES.CANDIDATE,
  },
];

// --- Brand metadata ---
export const BRAND = {
  name: 'Sanchivue',
  tagline: 'Live Technical Interview & AI Assessment Platform',
  creator: 'Sanchit Singhal',
  year: new Date().getFullYear(),
};
