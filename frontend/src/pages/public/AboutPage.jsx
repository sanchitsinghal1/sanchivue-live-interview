import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Code2, Users } from 'lucide-react';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import CreatorCredit from '../../components/common/CreatorCredit.jsx';
import { BRAND } from '../../constants/index.js';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <BrandLogo className="h-10" />
      <h1 className="mt-8 text-4xl font-bold text-slate-50">About Sanchivue</h1>
      <p className="mt-3 text-slate-400">{BRAND.tagline}</p>

      <div className="prose prose-invert mt-8 max-w-none">
        <p className="text-base leading-relaxed text-slate-300">
          Sanchivue is a live technical interview platform that brings the
          realism of a senior engineer&apos;s IDE into the hiring loop. Where
          traditional tools force candidates into textareas and interviewers
          into a sea of browser tabs, Sanchivue consolidates the entire
          workflow: a collaborative Monaco editor, sandboxed code execution,
          AI-assisted analysis, anti-cheat proctoring, structured rubrics,
          and an evidence-rich report — all in one workspace.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-100">The story</h2>
        <p className="mt-3 text-slate-300">
          Sanchivue was built by <span className="font-semibold text-slate-100">{BRAND.creator}</span>.
          The project started as an answer to a simple question: why does a
          software interview — the most consequential technical conversation in
          a hiring process — still happen across a fragile patchwork of video
          calls, shared docs, and ad-hoc code editors?
        </p>
        <p className="mt-3 text-slate-300">
          The result is a platform that is opinionated about structure (rubrics,
          test cases, hidden from candidates), generous about tooling (AI
          co-pilot, replay timeline, automated debrief summary), and respectful
          of the candidate&apos;s experience (clean waiting room, device checks,
          clear instructions).
        </p>

        <h2 className="mt-10 text-xl font-semibold text-slate-100">Principles</h2>
        <ul className="mt-3 space-y-2 text-slate-300">
          <li className="flex items-start gap-2">
            <Code2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />
            <span>
              <strong className="text-slate-100">Real tools, real code.</strong> Candidates
              write code in a real Monaco editor with language services, syntax highlighting,
              and consistent keyboard shortcuts.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />
            <span>
              <strong className="text-slate-100">AI as a co-pilot, not a judge.</strong> The
              AI surfaces bugs, edge cases, and follow-up questions for the interviewer. The
              final decision is always human.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand-indigo" />
            <span>
              <strong className="text-slate-100">Fair to candidates.</strong> Hidden tests
              stay hidden. The rubric is published after the session, with an AI summary
              the candidate can read.
            </span>
          </li>
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-slate-100">Technology</h2>
        <p className="mt-3 text-slate-300">
          Sanchivue is built with React + Vite on the frontend, an Express + MongoDB
          backend with JWT httpOnly-cookie auth, and a dedicated Socket.io service for
          real-time collaboration (presence, code sync, chat, whiteboard, proctoring,
          code snapshots, and WebRTC signaling relay).
        </p>
      </div>

      <div className="mt-12 flex flex-col items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-200">Want to try it?</p>
          <p className="text-xs text-slate-500">Use a demo account or create your own.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/register" className="btn-primary text-sm">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/login" className="btn-secondary text-sm">
            Try a demo
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <CreatorCredit />
      </div>
    </div>
  );
}
