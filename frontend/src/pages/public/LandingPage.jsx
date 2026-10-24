import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Bot,
  ShieldCheck,
  Play,
  GitBranch,
  Sparkles,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  ChevronDown,
  FileText,
  Link2,
  Rocket,
  Eye,
  Lock,
  Globe,
  Clock,
  Layers,
  X,
  Users,
  MessageSquare,
  PenTool,
  Cpu,
  Video,
  ClipboardCheck,
  Zap,
  Heart,
  Star,
} from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import CreatorCredit from '../../components/common/CreatorCredit.jsx';
import { BRAND } from '../../constants/index.js';

// Honest, product-grounded metrics — no fake customer counts, no invented
// testimonials. Every number below is verifiable against the seed data or the
// backend config.
const STATS = [
  { label: 'Pre-seeded DSA problems', value: '5' },
  { label: 'Sandboxed execution languages', value: '4' },
  { label: 'P99 code-sync latency', value: '<250ms' },
  { label: 'Structured rubric criteria', value: '8' },
];

// Sanchivue vs the old way — the differentiator section. Each row contrasts a
// familiar, broken interview pattern with how Sanchivue handles the same job.
const DIFFERENTIATORS = [
  {
    old: 'A shared Google Doc + a Zoom call',
    sanchivue: 'A real Monaco IDE with live presence cursors',
    detail:
      'Candidates write code in the same editor engineers use every day — with language services, keyboard shortcuts, and instant multi-cursor collaboration. No more "can you paste that again?"',
    icon: Code2,
  },
  {
    old: 'Guessing if the solution actually works',
    sanchivue: 'Public + hidden test cases run in a sandbox',
    detail:
      'Public tests give the candidate live feedback. Hidden tests grade them on the trusted server. The verdict flows back through the report — the question pane never leaks the answer.',
    icon: ShieldCheck,
  },
  {
    old: 'Scrambling notes after the call ends',
    sanchivue: 'A live scorecard that auto-saves per criterion',
    detail:
      'Score problem-solving, code quality, complexity, communication, and edge cases as they happen. The debrief writes itself in minutes — not the next morning.',
    icon: ClipboardCheck,
  },
  {
    old: 'Reading a final answer with no context',
    sanchivue: 'Scrub the candidate\'s code, keystroke by keystroke',
    detail:
      'Every edit is captured as a snapshot. Replay the timeline in the debrief to see how they reasoned — where they stalled, what they refactored, when the penny dropped.',
    icon: Eye,
  },
  {
    old: 'Interviewer alone, second-guessing signals',
    sanchivue: 'An AI co-pilot on the interviewer\'s side only',
    detail:
      'Live complexity analysis, edge-case prompts, and follow-up questions — surfaced privately to the interviewer, never to the candidate. The AI assists; the human decides.',
    icon: Bot,
  },
  {
    old: 'A rubric nobody agrees on',
    sanchivue: 'One structured rubric, applied to every candidate',
    detail:
      'Reusable templates bundle questions, allowed languages, duration, and an 8-criterion rubric — so every Senior SWE loop looks the same and is comparable across the team.',
    icon: Layers,
  },
];

// Feature deep-dives — each gets a full alternating row with a visual.
const FEATURE_DEEP_DIVES = [
  {
    icon: Code2,
    badge: 'Live IDE',
    title: 'A collaborative editor engineers actually want to use',
    body: 'Monaco powers the same editor behind VS Code. Syntax highlighting across 8 languages, real-time presence cursors, language switching on the fly, and a shared whiteboard for system-design sketches — all under one roof.',
    bullets: [
      'Multi-cursor presence with colored collaborator badges',
      'Language + theme switching synced to both participants',
      'Code reset with confirmation so a fresh start never destroys work',
      'Resizable split panes for editor, output, and notes',
    ],
    visual: 'editor',
  },
  {
    icon: Cpu,
    badge: 'Execution engine',
    title: 'Candidate code runs in a real sandbox, not your API process',
    body: 'JavaScript executes inside a hardened Node VM with a stripped sandbox, strict timeouts, capped stdout, and memory tracking — out of the box. Python, Java, and C++ run through a configurable Judge0 instance when you need them.',
    bullets: [
      'Per-test verdicts: Accepted, Wrong Answer, TLE, MLE, Runtime Error',
      'Public tests give feedback; hidden tests grade — they never leave the server',
      'Execution time + memory reported per case and in aggregate',
      'Optional BullMQ queue for high-volume submission pipelines',
    ],
    visual: 'execution',
  },
  {
    icon: Video,
    badge: 'Real-time room',
    title: 'Video, voice, chat, and a shared whiteboard — in one tab',
    body: 'WebRTC peer-to-peer audio/video with mute, camera toggle, and screen sharing. Socket.io carries the signaling, the code sync, the chat, and the proctoring telemetry. One link, one tab, nothing to install.',
    bullets: [
      'WebRTC offer/answer/ICE relayed over an authenticated socket',
      'Live chat with sender identity + timestamps, persisted to the session',
      'Shared HTML5 canvas whiteboard — pen, shapes, lines, clear',
      'Connection-state indicators and reconnection on drop',
    ],
    visual: 'room',
  },
  {
    icon: Bot,
    badge: 'AI co-pilot',
    title: 'An interviewer\'s second pair of eyes — never the candidate\'s',
    body: 'Paste the code, get back live Big-O analysis, potential bugs, edge-case gaps, and three adaptive follow-up questions tailored to what the candidate just wrote. The co-pilot is interviewer-only; the candidate never sees it.',
    bullets: [
      'Complexity detection (time + space) on the live code buffer',
      'Edge-case flags and bug hypotheses, grounded in the actual code',
      'Adaptive follow-up questions that probe the candidate\'s approach',
      'A deterministic local fallback so it works even before you add an AI key',
    ],
    visual: 'copilot',
  },
  {
    icon: Eye,
    badge: 'Code replay',
    title: 'Time-travel through how the candidate actually thought',
    body: 'Snapshots are captured every 15 seconds and on every Run/Submit. In the debrief, drag a timeline slider to watch the solution evolve — stalls, refactors, and the moment of insight, all visible.',
    bullets: [
      'Auto-snapshots every 15s + on every Run and Submit',
      'Timeline slider with play/pause and step controls',
      'Per-snapshot language + event type (auto / run / submit)',
      'Persists to the interview document, not just the browser',
    ],
    visual: 'replay',
  },
  {
    icon: FileText,
    badge: 'Evidence report',
    title: 'A debrief the hiring committee can actually defend',
    body: 'End the session to generate a rubric-scored report with a radar chart, the full proctoring timeline, the code-replay player, and an AI evidence summary. Share it, print it, or export it — every claim tied to a captured signal.',
    bullets: [
      '8-criterion rubric with interactive sliders (auto-saved)',
      'Radar chart visualizing strengths vs. gaps at a glance',
      'AI evidence summary that distinguishes observed facts from inference',
      'Printable + shareable — never exposes private interviewer notes',
    ],
    visual: 'report',
  },
];

// Compact feature grid — every capability at a glance.
const FEATURE_GRID = [
  { icon: Code2, label: 'Collaborative Monaco IDE' },
  { icon: Cpu, label: 'Sandboxed code execution' },
  { icon: Video, label: 'WebRTC audio / video / screen share' },
  { icon: PenTool, label: 'Shared system-design whiteboard' },
  { icon: MessageSquare, label: 'Real-time chat with persistence' },
  { icon: Bot, label: 'Interviewer-only AI co-pilot' },
  { icon: ShieldCheck, label: 'Anti-cheat proctoring telemetry' },
  { icon: Eye, label: 'Keystroke-level code replay' },
  { icon: ClipboardCheck, label: 'Live structured rubric scorecard' },
  { icon: FileText, label: 'Evidence-rich debrief reports' },
  { icon: Layers, label: 'Reusable interview templates' },
  { icon: Link2, label: 'Secure candidate invitation links' },
  { icon: Users, label: 'Organization + team permissions' },
  { icon: GitBranch, label: 'Public + hidden test cases' },
  { icon: Sparkles, label: 'JD → assessment blueprint engine' },
  { icon: Lock, label: 'JWT in httpOnly cookies + RBAC' },
];

const HOW_IT_WORKS = [
  {
    icon: FileText,
    title: 'Paste the job description',
    desc: 'Drop in the JD. Sanchivue drafts the role, required skills, and focus areas — then pre-fills the interview wizard with a starter rubric and question set.',
  },
  {
    icon: Rocket,
    title: 'Launch the live room',
    desc: 'Pick questions, set allowed languages, choose an AI policy, and share a single secure invitation link. The candidate joins from a browser — nothing to install.',
  },
  {
    icon: Layers,
    title: 'Export the evidence report',
    desc: 'End the session to produce a rubric-scored report with a radar chart, code-replay timeline, and an AI-generated debrief summary. Share it with the hiring committee in one click.',
  },
];

const USE_CASES = [
  {
    icon: Briefcase,
    title: 'For Recruiters',
    points: [
      'Spin up a role-ready interview from a JD in minutes',
      'Send one secure link — no calendars, no installs for candidates',
      'Compare candidates on the same structured rubric, not vibes',
      'Hand the committee an evidence report, not a gut feeling',
    ],
  },
  {
    icon: Code2,
    title: 'For Engineering Teams',
    points: [
      'Pair-program in a real Monaco editor across languages',
      'Co-pilot catches the bugs the candidate missed, live',
      'Replay the code timeline in the debrief — see how they thought',
      'Reuse templates so every Senior SWE loop looks the same',
    ],
  },
  {
    icon: GraduationCap,
    title: 'For Interviewers',
    points: [
      'Live scorecard auto-saves per criterion, no end-of-day recall',
      'Hidden tests and private notes stay on your side of the room',
      'AI summary drafts the debrief so you can leave on time',
      'Bring your own questions or pull from the shared bank',
    ],
  },
];

const FAQ = [
  {
    q: 'Does the AI make hiring decisions?',
    a: 'No. Sanchivue\'s AI is a co-pilot for interviewers — it surfaces bugs, complexity, edge cases, and follow-up questions during the session, and drafts a debrief summary afterward. Humans make every hire decision and approve every score.',
  },
  {
    q: 'Is my data secure?',
    a: 'Authentication is JWT in httpOnly cookies; the candidate never sees hidden tests, the rubric draft, or the interviewer\'s co-pilot. Proctoring logs are visible to both sides only after the session ends — never used as the sole signal.',
  },
  {
    q: 'Can I use my own questions?',
    a: 'Yes. The question bank supports coding, system-design, and behavioral questions with public + hidden test cases, per-language starter code, and tags. You can also bundle reusable question sets into templates and apply them in one click.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. Sanchivue runs entirely in the browser. Candidates receive a secure invitation link, complete a quick device check in a waiting room, and enter the live workspace. Interviewers get the same browser-first experience.',
  },
  {
    q: 'What languages are supported?',
    a: 'JavaScript, Python, Java, and C++ run in the sandboxed execution engine today. The Monaco editor additionally offers TypeScript, C, Go, and Rust syntax highlighting for system-design or read-only use.',
  },
  {
    q: 'Is there a free tier?',
    a: 'Yes. The Starter tier is free forever for individuals trying out the platform — every feature is available, with a soft cap on active interviews per month. See the Pricing page for the full breakdown.',
  },
  {
    q: 'Who built Sanchivue?',
    a: 'Sanchivue was designed and built by Sanchit Singhal as an original product. No customer names, testimonials, or usage statistics are fabricated anywhere in the platform — every metric you see is verifiable against the seed data or the backend configuration.',
  },
];

// Renders a stylized visual for each feature deep-dive row.
function DeepDiveVisual({ kind }) {
  if (kind === 'editor') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-brand-emerald" />
          <span className="ml-3 font-mono text-[10px] text-slate-500">two-sum.js · 2 collaborators</span>
          <span className="ml-auto flex items-center gap-1 text-[10px] text-brand-emerald">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-emerald" /> LIVE
          </span>
        </div>
        <pre className="overflow-x-auto p-4 font-mono text-[11px] leading-relaxed text-slate-300">
{`function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];  ◀ Alex (interviewer)
    }
    seen.set(nums[i], i);
  }
  return [];
}`}
        </pre>
      </div>
    );
  }
  if (kind === 'execution') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="border-b border-slate-800 px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Submission results
        </div>
        <div className="space-y-2 p-4">
          {[
            { t: '[2,7,11,15], 9', r: '[0,1]', ok: true, tag: 'public' },
            { t: '[3,2,4], 6', r: '[1,2]', ok: true, tag: 'public' },
            { t: '[3,3], 6', r: '[0,1]', ok: true, tag: 'hidden' },
            { t: '[1,5,8,12,13], 21', r: '[2,3]', ok: true, tag: 'hidden' },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-[11px]">
              {c.ok ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-emerald" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              )}
              <span className="font-mono text-slate-300">{c.t}</span>
              <span className="text-slate-500">→</span>
              <span className="font-mono text-brand-emerald">{c.r}</span>
              <span className="ml-auto rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-slate-400">
                {c.tag}
              </span>
            </div>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-2 text-[10px] text-slate-400">
            <span className="text-brand-emerald">✓ Accepted · 4/4 passed</span>
            <span>12ms · 200KB</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'room') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="grid grid-cols-2 gap-2 p-3">
          <div className="rounded-lg bg-gradient-to-br from-brand-indigo/30 to-slate-900 p-4 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-indigo text-xs font-bold text-white">AI</div>
            <p className="mt-2 text-[11px] text-slate-300">Alex · Interviewer</p>
            <p className="text-[9px] text-brand-emerald">mic · cam on</p>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-brand-emerald/30 to-slate-900 p-4 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-emerald text-xs font-bold text-white">CC</div>
            <p className="mt-2 text-[11px] text-slate-300">Casey · Candidate</p>
            <p className="text-[9px] text-brand-emerald">mic · cam on</p>
          </div>
        </div>
        <div className="space-y-1.5 border-t border-slate-800 p-3">
          <div className="flex justify-end">
            <span className="rounded-lg rounded-br-sm bg-brand-indigo px-2.5 py-1 text-[10px] text-white">Can you optimize for space?</span>
          </div>
          <div className="flex justify-start">
            <span className="rounded-lg rounded-bl-sm bg-slate-800 px-2.5 py-1 text-[10px] text-slate-200">Good point — let me try a two-pointer approach</span>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'copilot') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="border-b border-slate-800 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-brand-indigo">
          AI co-pilot · interviewer only
        </div>
        <div className="space-y-3 p-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Complexity</p>
            <div className="mt-1 flex gap-2">
              <span className="rounded bg-brand-indigo/15 px-2 py-0.5 text-[10px] text-brand-indigo">O(n) time</span>
              <span className="rounded bg-brand-emerald/15 px-2 py-0.5 text-[10px] text-brand-emerald">O(n) space</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Potential bugs</p>
            <p className="mt-1 text-[11px] text-amber-300">↳ Map key collision on duplicate values</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Follow-up questions</p>
            <ol className="mt-1 space-y-1 text-[11px] text-slate-300">
              <li>1. How does this behave with negative integers?</li>
              <li>2. Can you reduce space to O(1)?</li>
              <li>3. What if the array is streamed?</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'replay') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="border-b border-slate-800 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500">
          Code replay · 12 snapshots
        </div>
        <pre className="p-4 font-mono text-[10px] leading-relaxed text-slate-300">
{`  00:00  function twoSum(nums, target) {
  00:15    const seen = new Map();
  00:42    for (let i = 0; i < nums.length; i++) {
  01:03      const need = target - nums[i];
  01:21      if (seen.has(need)) return [seen.get(need), i];
  01:38      seen.set(nums[i], i);
  02:01    }
  02:14    return [];
  ▶ now`}
        </pre>
        <div className="border-t border-slate-800 p-3">
          <div className="relative h-1.5 rounded-full bg-slate-800">
            <div className="absolute left-0 top-0 h-1.5 w-2/3 rounded-full bg-gradient-to-r from-brand-indigo to-brand-emerald" />
            <div className="absolute left-2/3 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-indigo bg-white" />
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-500">02:01 · refactor loop boundary</p>
        </div>
      </div>
    );
  }
  if (kind === 'report') {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <div className="border-b border-slate-800 px-4 py-2 text-[10px] uppercase tracking-wider text-slate-500">
          Evaluation report · Casey Candidate
        </div>
        <div className="grid grid-cols-2 gap-4 p-4">
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Rubric</p>
            <div className="space-y-1.5">
              {[
                { l: 'Problem solving', v: 70 },
                { l: 'Code quality', v: 85 },
                { l: 'Optimization', v: 60 },
                { l: 'Communication', v: 90 },
              ].map((r) => (
                <div key={r.l}>
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>{r.l}</span>
                    <span>{r.v / 10}/10</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-emerald" style={{ width: `${r.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid place-items-center">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <polygon points="50,10 90,38 75,86 25,86 10,38" fill="none" stroke="#1e293b" strokeWidth="2" />
                <polygon points="50,30 72,46 64,74 36,74 28,46" fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="1.5" />
              </svg>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-800 px-4 py-2">
          <span className="rounded bg-brand-emerald/15 px-2 py-0.5 text-[10px] font-medium text-brand-emerald">Recommended: HIRE</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="overflow-hidden">
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 20% 10%, rgba(99,102,241,0.20) 0%, transparent 60%), radial-gradient(50% 40% at 80% 30%, rgba(16,185,129,0.16) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <Link to="/about" className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition hover:border-slate-700">
              <Sparkles className="h-3 w-3 text-brand-indigo" />
              A live interview platform built by {BRAND.creator}
              <ArrowRight className="h-3 w-3" />
            </Link>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Run technical interviews that actually predict{' '}
              <span className="bg-gradient-to-r from-brand-indigo to-brand-emerald bg-clip-text text-transparent">
                on-the-job performance
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              Sanchivue is a live interview workspace built around real code
              execution, structured rubrics, and evidence-rich reports — so your
              hiring decisions reflect how candidates actually engineer, not how
              they perform in a textarea.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary w-full sm:w-auto">
                Start your first interview <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="btn-secondary w-full sm:w-auto">
                <Play className="h-4 w-4" /> See how it works
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              No credit card. Demo accounts available on the login page.
            </p>
          </div>

          {/* Hero product visual — a stylized split-pane */}
          <div className="mx-auto mt-16 max-w-5xl">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-slate-800 bg-slate-950 px-4 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span className="h-2.5 w-2.5 rounded-full bg-brand-emerald" />
                <span className="ml-3 font-mono text-xs text-slate-500">
                  sanchivue://interviews/abc-123/room
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 p-3 md:grid-cols-2">
                <div className="rounded-md bg-slate-950 p-3">
                  <pre className="font-mono text-[11px] leading-relaxed text-slate-300">
{`function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
}`}
                  </pre>
                </div>
                <div className="space-y-2">
                  <div className="rounded-md bg-slate-950 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-brand-indigo">
                      Interviewer co-pilot
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Complexity: O(n) time, O(n) space</p>
                    <p className="text-xs text-slate-300">Candidate handled duplicate values correctly</p>
                    <p className="text-xs text-amber-300">Suggest probing integer overflow on large inputs</p>
                  </div>
                  <div className="rounded-md bg-slate-950 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-brand-emerald">
                      Test cases
                    </p>
                    <p className="mt-1 text-xs text-slate-300">✓ [2,7,11,15], 9 → [0,1]</p>
                    <p className="text-xs text-slate-300">✓ [3,2,4], 6 → [1,2]</p>
                    <p className="text-xs text-slate-500">3 hidden cases — verdict withheld</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-800 bg-slate-800 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-slate-950 px-4 py-5 text-center">
                <div className="bg-gradient-to-r from-brand-indigo to-brand-emerald bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── Differentiators: Sanchivue vs the old way ──────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              <Zap className="h-3 w-3 text-amber-400" /> Why Sanchivue is different
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-50 sm:text-4xl">
              The old way vs. the Sanchivue way
            </h2>
            <p className="mt-3 text-slate-400">
              Every row replaces a familiar, broken interview pattern with how
              Sanchivue handles the same job — end to end.
            </p>
          </div>
          <div className="mt-12 space-y-3">
            {DIFFERENTIATORS.map((d) => {
              const Icon = d.icon;
              return (
                <div key={d.old} className="card overflow-hidden p-0">
                  <div className="grid gap-0 md:grid-cols-12">
                    {/* Old way */}
                    <div className="border-b border-slate-800 p-5 md:col-span-4 md:border-b-0 md:border-r">
                      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
                        <X className="h-3 w-3" /> The old way
                      </p>
                      <p className="mt-2 text-sm text-slate-400 line-through decoration-rose-500/40">
                        {d.old}
                      </p>
                    </div>
                    {/* Sanchivue way */}
                    <div className="p-5 md:col-span-8">
                      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-brand-emerald">
                        <Icon className="h-3 w-3" /> Sanchivue
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-100">
                        {d.sanchivue}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">
                        {d.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────── Feature deep-dives (alternating rows) ──────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="features">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            <Layers className="h-3 w-3 text-brand-indigo" /> Feature deep-dives
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-50 sm:text-4xl">
            One platform, every step of the loop
          </h2>
          <p className="mt-3 text-slate-400">
            Sanchivue replaces the patchwork of video calls, shared docs, and
            ad-hoc code editors with a single platform — opinionated about
            structure, generous about tooling.
          </p>
        </div>

        <div className="mt-16 space-y-20">
          {FEATURE_DEEP_DIVES.map((f, i) => {
            const Icon = f.icon;
            const flipped = i % 2 === 1;
            return (
              <div key={f.title} className="grid items-center gap-10 md:grid-cols-2">
                <div className={flipped ? 'md:order-2' : ''}>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs">
                    <Icon className="h-3 w-3 text-brand-indigo" />
                    <span className="text-slate-300">{f.badge}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-slate-50">
                    {f.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400">
                    {f.body}
                  </p>
                  <ul className="mt-5 space-y-2">
                    {f.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={flipped ? 'md:order-1' : ''}>
                  <DeepDiveVisual kind={f.visual} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ──────────────────── Compact feature grid ──────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
              Every capability, at a glance
            </h2>
            <p className="mt-3 text-slate-400">
              Sixteen features wired end to end — each one connected to its
              backend route, no dead buttons.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {FEATURE_GRID.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="card flex items-center gap-3 p-4 transition hover:border-slate-700">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-indigo/10 text-brand-indigo">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-medium text-slate-200">{f.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────── How it works ──────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            <Clock className="h-3 w-3 text-brand-emerald" /> Three steps
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-50 sm:text-4xl">
            From job description to evidence report
          </h2>
          <p className="mt-3 text-slate-400">
            No spinup call, no installs, no shared Google Doc. Just a JD, a live
            room, and a report you can defend.
          </p>
        </div>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {HOW_IT_WORKS.map((s, i) => (
            <li key={s.title} className="card p-6">
              <div className="flex items-center justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-indigo/10 text-brand-indigo">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-3xl font-extrabold text-slate-800">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ──────────────────── Use cases ──────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
              Built for every role in the loop
            </h2>
            <p className="mt-3 text-slate-400">
              Recruiters, engineering teams, and interviewers each get a
              workspace shaped to how they actually work.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {USE_CASES.map((u) => (
              <div key={u.title} className="card p-6">
                <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-emerald/10 text-brand-emerald">
                  <u.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-100">{u.title}</h3>
                <ul className="mt-3 space-y-2">
                  {u.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-slate-400">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-emerald" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────── Security & trust ──────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              <Lock className="h-3 w-3 text-brand-emerald" /> Security & trust
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-50 sm:text-4xl">
              Candidate code never touches your secrets
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Execution runs in a hardened Node VM with a stripped sandbox — no
              <code className="mx-1 rounded bg-slate-800 px-1 text-slate-200">require</code>,
              no <code className="mx-1 rounded bg-slate-800 px-1 text-slate-200">process</code>,
              no file system. Hidden tests are evaluated server-side only and
              never serialized to the browser.
            </p>
            <ul className="mt-5 space-y-2">
              {[
                'bcrypt password hashing + JWT in httpOnly cookies',
                'Role-based access + organization-scoped data isolation',
                'Rate limiting, request validation, and Helmet security headers',
                'Audit logging for privileged actions across the org',
                'Proctoring telemetry visible to both sides after the session',
              ].map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <Lock className="mx-auto h-6 w-6 text-brand-emerald" />
                <p className="mt-2 text-sm font-semibold text-slate-100">httpOnly JWT</p>
                <p className="text-[10px] text-slate-500">cookies, never localStorage</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <ShieldCheck className="mx-auto h-6 w-6 text-brand-indigo" />
                <p className="mt-2 text-sm font-semibold text-slate-100">Hidden tests</p>
                <p className="text-[10px] text-slate-500">server-side only</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <Cpu className="mx-auto h-6 w-6 text-amber-400" />
                <p className="mt-2 text-sm font-semibold text-slate-100">Sandboxed VM</p>
                <p className="text-[10px] text-slate-500">no host access</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
                <Users className="mx-auto h-6 w-6 text-brand-emerald" />
                <p className="mt-2 text-sm font-semibold text-slate-100">Org isolation</p>
                <p className="text-[10px] text-slate-500">per-tenant scoping</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────── About Sanchivue + Creator ──────────────────── */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <BrandLogo className="mx-auto h-10" />
          <h2 className="mt-6 text-3xl font-bold text-slate-50 sm:text-4xl">
            About Sanchivue
          </h2>
          <p className="mt-4 text-slate-400">
            Sanchivue was built by{' '}
            <span className="font-semibold text-slate-200">{BRAND.creator}</span>{' '}
            to fix the gap between take-home tests and real engineering signal.
            Take-home assignments are asynchronous and over-engineered. Live
            coding in a textarea is synchronous but unreal. Sanchivue sits in
            the middle: a real IDE, real test cases, and a real rubric —
            captured live, replayed end to end, and exported as evidence your
            hiring committee can defend.
          </p>
          <p className="mt-3 text-slate-400">
            The product is open and documented end to end — React + Vite on the
            frontend, Express + MongoDB on the backend, and a dedicated
            Socket.io service for real-time collaboration. Every component is
            shaped so a team can extend it to their own hiring rubric, their
            own question bank, and their own engineering bar.
          </p>

          {/* Creator card */}
          <div className="mx-auto mt-8 max-w-md rounded-xl border border-slate-800 bg-slate-950 p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand-indigo to-brand-emerald text-lg font-bold text-white">
                {BRAND.creator.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="text-left">
                <p className="text-base font-semibold text-slate-100">{BRAND.creator}</p>
                <p className="text-xs text-slate-400">Creator &amp; engineer, Sanchivue</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                  <Star className="h-3 w-3 fill-amber-400" />
                  <span>Original product · no fabricated claims</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-left text-xs leading-relaxed text-slate-400">
              &ldquo;Sanchivue is built to make hiring decisions defensible — every
              rubric score, every code snapshot, every proctoring signal is
              captured and tied to the report. The AI assists; the human
              decides.&rdquo;
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <CreatorCredit />
            <span className="text-slate-700">·</span>
            <Link to="/about" className="text-xs text-brand-indigo hover:underline">
              Read the full story
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────────── FAQ ──────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6" id="faq">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            <Lock className="h-3 w-3 text-brand-emerald" /> Honest answers
          </span>
          <h2 className="mt-4 text-3xl font-bold text-slate-50 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-8 space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-100"
                aria-expanded={openFaq === i}
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm leading-relaxed text-slate-400">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────── Final CTA ──────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'radial-gradient(50% 60% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <BrandLogo markOnly className="mx-auto h-12" />
            <h2 className="mt-6 text-3xl font-bold text-slate-50 sm:text-4xl">
              Ready to run your next interview?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Spin up a live interview in minutes. Use a demo account, or
              create your organization and bring your own question bank.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary w-full sm:w-auto">
                Create an account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto">
                Try a demo account
              </Link>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-[11px] uppercase tracking-wider text-slate-500">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" /> Browser-first, nothing to install
              </span>
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5" /> One secure invitation link
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-400" /> Built by {BRAND.creator}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
