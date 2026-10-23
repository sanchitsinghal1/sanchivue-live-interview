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
  { label: 'Real-time rubric criteria', value: '8' },
];

const FEATURES = [
  {
    icon: Code2,
    title: 'A real IDE, not a textarea',
    desc: 'Candidates write code in a collaborative Monaco editor with language services, presence cursors, and the same keyboard shortcuts they use every day.',
  },
  {
    icon: Eye,
    title: 'Code replay, end to end',
    desc: 'Every keystroke is captured. Scrub the timeline in the debrief to relive the candidate\'s thought process — not just the final answer.',
  },
  {
    icon: Bot,
    title: 'An interviewer\'s co-pilot',
    desc: 'Live complexity analysis, edge-case prompts, and follow-up suggestions — surfaced only on the interviewer\'s side, never on the candidate\'s.',
  },
  {
    icon: ShieldCheck,
    title: 'Proctoring that respects the candidate',
    desc: 'Tab switches, window blur, anomalous pastes, and fullscreen exits are logged to the timeline — visible to both sides after the session, never used as the sole signal.',
  },
  {
    icon: FileText,
    title: 'Evidence-rich reports',
    desc: 'A rubric-scored report with a radar chart, code-replay timeline, and AI-generated summary — the debrief writes itself in minutes, not an hour.',
  },
  {
    icon: GitBranch,
    title: 'Hidden tests stay hidden',
    desc: 'Public tests give the candidate feedback. Hidden tests grade them. The verdict flows back through the report — never the question pane.',
  },
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
      'Hand the hiring committee an evidence report, not a gut feeling',
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
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 20% 10%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(50% 40% at 80% 30%, rgba(16,185,129,0.16) 0%, transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              <Sparkles className="h-3 w-3 text-brand-indigo" />
              A live technical interview platform by {BRAND.creator}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Run technical interviews that actually predict{' '}
              <span className="bg-gradient-to-r from-brand-indigo to-brand-emerald bg-clip-text text-transparent">
                on-the-job performance
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              Sanchivue is a live interview workspace built around real code
              execution, structured rubrics, and an evidence-rich report — so
              your hiring decisions reflect how candidates actually engineer,
              not how they perform in a textarea.
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

          {/* Hero "screenshot" — a stylized split-pane */}
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
  return [];
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

      {/* Features grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="features">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            One workspace, end to end
          </h2>
          <p className="mt-3 text-slate-400">
            Sanchivue replaces the patchwork of video calls, shared docs, and
            ad-hoc code editors with a single platform — opinionated about
            structure, generous about tooling.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card p-6 transition hover:border-slate-700 hover:shadow-glow"
            >
              <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-indigo/10 text-brand-indigo">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
              <Clock className="h-3 w-3 text-brand-emerald" /> Three steps
            </span>
            <h2 className="mt-4 text-3xl font-bold text-slate-50 sm:text-4xl">
              From job description to evidence report
            </h2>
            <p className="mt-3 text-slate-400">
              No spinup call, no installs, no shared Google Doc. Just a JD, a
              live room, and a report you can defend.
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
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
            Built for every role in the loop
          </h2>
          <p className="mt-3 text-slate-400">
            Recruiters, engineering teams, and interviewers each get a workspace
            shaped to how they actually work.
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
      </section>

      {/* About Sanchivue + Creator */}
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
            the middle: a real IDE, real test cases, and a real rubric — captured
            live, replayed end to end, and exported as evidence your hiring
            committee can defend.
          </p>
          <p className="mt-3 text-slate-400">
            The product is open and documented end to end — React + Vite on the
            frontend, Express + MongoDB on the backend, and a dedicated Socket.io
            service for real-time collaboration. Every component is shaped so a
            team can extend it to their own hiring rubric, their own question
            bank, and their own engineering bar.
          </p>
          <div className="mt-6">
            <CreatorCredit />
          </div>
          <Link to="/about" className="btn-secondary mt-6">
            Read the full story <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
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

      {/* CTA */}
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
            <h2 className="text-3xl font-bold text-slate-50 sm:text-4xl">
              Ready to run your next interview?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Spin up a live interview in minutes. Use a demo account, or create
              your organization and bring your own question bank.
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
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
