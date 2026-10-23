import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Code2,
  Bot,
  Shield,
  Play,
  GitBranch,
  Sparkles,
  CheckCircle2,
  Users,
  Briefcase,
  GraduationCap,
  CalendarClock,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import CreatorCredit from '../../components/common/CreatorCredit.jsx';
import { BRAND } from '../../constants/index.js';

const FEATURES = [
  {
    icon: Code2,
    title: 'Live Collaborative IDE',
    desc: 'Monaco editor with real-time code sync, presence cursors, language switching, and shared test-case panels.',
  },
  {
    icon: Bot,
    title: 'AI Co-Pilot',
    desc: 'Interviewer-only assistant that analyzes complexity, surfaces bugs, suggests edge cases, and proposes follow-up questions.',
  },
  {
    icon: Shield,
    title: 'Sandboxed Execution',
    desc: 'Run candidate code in isolated containers with strict time/memory limits. Hidden tests stay hidden.',
  },
  {
    icon: Users,
    title: 'Anti-Cheat Proctoring',
    desc: 'Tab-switch, window-blur, large paste, and fullscreen-exit events are logged to the report timeline.',
  },
  {
    icon: Sparkles,
    title: 'JD-Driven Assessment',
    desc: 'Paste a job description and get an AI-generated assessment blueprint — rubric, questions, and focus areas.',
  },
  {
    icon: GitBranch,
    title: 'Code Replay',
    desc: 'Every keystroke snapshot is saved. Scrub the timeline in the report to relive the candidate\'s thought process.',
  },
];

const STEPS = [
  {
    title: '1 · Build your question bank',
    desc: 'Create coding, system-design, or behavioral questions with public + hidden test cases and per-language starter code.',
  },
  {
    title: '2 · Schedule an interview',
    desc: 'Use the multi-step wizard to set job role, JD, interviewers, allowed languages, rubric, and AI policy.',
  },
  {
    title: '3 · Candidate joins the room',
    desc: 'The candidate opens a secure invitation link, completes device checks, and enters the live workspace.',
  },
  {
    title: '4 · Run & assess in real time',
    desc: 'Collaborate on code, chat, whiteboard, and video. The interviewer uses the AI co-pilot and rubric scorecard.',
  },
  {
    title: '5 · Generate the report',
    desc: 'End the session to produce a rubric-scored report with radar chart, AI evidence summary, proctoring log, and replay timeline.',
  },
];

const USE_CASES = [
  {
    icon: Briefcase,
    title: 'For Recruiters',
    points: [
      'Schedule interviews with one secure link',
      'Track pipeline + reports across roles',
      'Reduce bias with structured rubrics',
    ],
  },
  {
    icon: Code2,
    title: 'For Engineering Teams',
    points: [
      'Pair-program in a real IDE, not a textarea',
      'AI co-pilot catches bugs the candidate missed',
      'Replay the code timeline in debriefs',
    ],
  },
  {
    icon: GraduationCap,
    title: 'For Interviewers',
    points: [
      'Live scorecard auto-saves per criterion',
      'Hidden tests + private notes',
      'AI summary writes your debrief for you',
    ],
  },
];

const FAQ = [
  {
    q: 'How are code submissions sandboxed?',
    a: 'Each run executes in an isolated container with strict CPU/memory/time limits. Hidden test cases are never returned to the candidate.',
  },
  {
    q: 'Do I need to install anything to host a session?',
    a: 'No. Sanchivue runs entirely in the browser. Candidates receive a secure invitation link and join a waiting room that performs device checks.',
  },
  {
    q: 'What languages are supported?',
    a: 'JavaScript, TypeScript, Python, Java, C++, C, Go, and Rust — selectable per interview.',
  },
  {
    q: 'What does the AI co-pilot actually do?',
    a: 'Given the current code, it analyzes time/space complexity, potential bugs, edge cases, and suggests follow-up questions. It is visible to interviewers only.',
  },
  {
    q: 'Is my data secure?',
    a: 'Authentication uses JWT in httpOnly cookies. Sessions are role-gated; candidates never see hidden tests, the rubric draft, or the AI co-pilot.',
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
              {BRAND.tagline}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
              Run technical interviews that feel like{' '}
              <span className="bg-gradient-to-r from-brand-indigo to-brand-emerald bg-clip-text text-transparent">
                real engineering
              </span>
              .
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
              Sanchivue brings together a collaborative Monaco editor, AI co-pilot,
              sandboxed execution, anti-cheat proctoring, and instant rubric-scored
              reports — all in one live workspace.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary w-full sm:w-auto">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="btn-secondary w-full sm:w-auto">
                <Play className="h-4 w-4" /> Explore the Platform
              </Link>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              No credit card required. Demo accounts available on the login page.
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
                    <p className="text-[10px] uppercase tracking-wider text-brand-indigo">AI Co-Pilot</p>
                    <p className="mt-1 text-xs text-slate-300">Complexity: O(n) time, O(n) space</p>
                    <p className="text-xs text-slate-300">✓ Handles duplicates correctly</p>
                    <p className="text-xs text-amber-300">⚠ Consider integer overflow on edge inputs</p>
                  </div>
                  <div className="rounded-md bg-slate-950 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-brand-emerald">Test Cases</p>
                    <p className="mt-1 text-xs text-slate-300">✓ Case 1: [2,7,11,15], 9 → [0,1]</p>
                    <p className="text-xs text-slate-300">✓ Case 2: [3,2,4], 6 → [1,2]</p>
                    <p className="text-xs text-slate-300">✓ Case 3: [3,3], 6 → [0,1]</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="features">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-50">Everything in one workspace</h2>
          <p className="mt-3 text-slate-400">
            Sanchivue replaces the patchwork of video calls, shared docs, and
            ad-hoc code editors with a single integrated platform.
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

      {/* How it works */}
      <section className="border-y border-slate-800 bg-slate-900/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-slate-50">How it works</h2>
            <p className="mt-3 text-slate-400">From question bank to debrief in five steps.</p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="card p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-indigo text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <CalendarClock className="h-4 w-4 text-slate-500" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-100">{s.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-slate-50">Built for every role in the loop</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {USE_CASES.map((u) => (
            <div key={u.title} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-brand-emerald/10 text-brand-emerald">
                <u.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-100">{u.title}</h3>
              <ul className="mt-3 space-y-1.5">
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
          <h2 className="mt-6 text-3xl font-bold text-slate-50">
            About Sanchivue
          </h2>
          <p className="mt-4 text-slate-400">
            Sanchivue was created by <span className="font-semibold text-slate-200">{BRAND.creator}</span>{' '}
            to give technical recruiters and engineering teams a single, opinionated
            platform for running live interviews — without sacrificing the rigor of
            real code execution, structured rubrics, or anti-cheat telemetry.
          </p>
          <p className="mt-3 text-slate-400">
            The product is built on a modern stack: React + Vite, an Express + MongoDB
            backend, and a Socket.io collaboration service. Every component is open
            and documented so teams can extend it to their own hiring rubric.
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
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-slate-50">
          Frequently asked questions
        </h2>
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
                <div className="px-4 pb-4 text-sm text-slate-400">{item.a}</div>
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
            <h2 className="text-3xl font-bold text-slate-50">
              Ready to run your next interview?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Spin up a live interview in minutes. Use a demo account or create
              your organization.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/register" className="btn-primary w-full sm:w-auto">
                Create an account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/login" className="btn-secondary w-full sm:w-auto">
                Try a demo account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
