"use client";

import {
  Code2,
  Video,
  Sparkles,
  ShieldAlert,
  Play,
  Users,
  GitBranch,
  Brain,
  Zap,
  CheckCircle2,
  ArrowRight,
  Terminal,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppFooter } from "@/components/common/app-footer";

const FEATURES = [
  {
    icon: Video,
    title: "Live Collaborative IDE",
    desc: "Sub-250ms code sync with multi-cursor presence, shared language switching, and a real-time system-design whiteboard.",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    icon: Brain,
    title: "AI Interviewer Co-Pilot",
    desc: "Live Big-O analysis, bug detection, edge-case flags, and adaptive follow-up questions tailored to the candidate's exact code.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: Terminal,
    title: "Sandboxed Code Execution",
    desc: "Run & submit against public + hidden test cases with per-case timing, memory tracking, and Accepted / TLE / MLE / RTE verdicts.",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: ShieldAlert,
    title: "Anti-Cheat Proctoring",
    desc: "Real-time telemetry for tab switches, window blur, paste anomalies, and fullscreen exits — streamed to the interviewer's feed.",
    accent: "from-rose-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "JD-to-Assessment Engine",
    desc: "Paste a job description and the AI returns recommended topics, tailored problems with test cases, and a custom rubric.",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    icon: Eye,
    title: "Code Replay & Evidence Reports",
    desc: "Time-travel through the candidate's code evolution and export evidence-based rubric reports with an AI summary.",
    accent: "from-fuchsia-500 to-purple-500",
  },
];

const STATS = [
  { label: "Avg. signal-to-offer time", value: "-62%" },
  { label: "Proctoring alerts captured", value: "100%" },
  { label: "Code sync latency", value: "<250ms" },
  { label: "Languages supported", value: "4" },
];

export function LandingView() {
  const { setView } = useAppStore();

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.16_0.02_264)] text-slate-200">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[oklch(0.16_0.02_264)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500">
              <Code2 className="h-4 w-4 text-white" />
            </span>
            <span className="text-lg text-slate-100">LiveInterview</span>
            <Badge
              variant="outline"
              className="ml-2 border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
            >
              AI-native
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setView("login")}
              className="text-slate-300 hover:text-white"
            >
              Sign in
            </Button>
            <Button
              onClick={() => setView("register")}
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
            >
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -top-20 right-10 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <Badge
              variant="outline"
              className="mb-6 border-white/20 bg-white/5 text-slate-300"
            >
              <Zap className="mr-1 h-3 w-3 text-emerald-400" />
              CoderPad × HackerRank × LeetCode — reimagined
            </Badge>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
              Run live technical interviews
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-emerald-400 bg-clip-text text-transparent">
                {" "}
                with an AI co-pilot in the room
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-slate-300 sm:text-lg">
              A real-time, collaborative interview platform with sandboxed code
              execution, anti-cheat proctoring, JD-driven assessments, and
              evidence-based rubric reports — all in one dark, developer-grade
              workspace.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => setView("register")}
                className="w-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90 sm:w-auto"
              >
                Start interviewing free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setView("login")}
                className="w-full border-white/20 bg-white/5 text-slate-200 hover:bg-white/10 sm:w-auto"
              >
                <Play className="mr-2 h-4 w-4" />
                Try the live demo
              </Button>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Demo accounts pre-seeded — no credit card, no setup. Sign in with{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-300">
                interviewer@demo.dev
              </code>{" "}
              /{" "}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-emerald-300">
                interviewer123
              </code>
            </p>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
              >
                <div className="text-2xl font-bold text-white">{s.value}</div>
                <div className="mt-1 text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-white">
            Everything an engineering hiring loop needs
          </h2>
          <p className="mt-3 text-slate-400">
            Six tightly-integrated modules, one cohesive experience.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[oklch(0.19_0.02_264)] p-6 transition-all hover:border-white/20 hover:bg-[oklch(0.21_0.025_264)]"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${f.accent}`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Workflow */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-white/10 bg-[oklch(0.19_0.02_264)] p-8 sm:p-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">
                From job description to evidence report in one flow.
              </h2>
              <p className="mt-4 text-slate-400">
                Generate a tailored assessment, launch a live room with video &
                a collaborative IDE, let the AI co-pilot surface signals in real
                time, then export an evidence-based rubric report.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Paste a JD → AI returns problems + rubric in seconds",
                  "Invite a candidate into a live room with one click",
                  "Watch code, complexity, and proctoring signals side-by-side",
                  "Score against a structured rubric + AI evidence summary",
                ].map((step) => (
                  <li key={step} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <span className="text-sm text-slate-300">{step}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
                onClick={() => setView("register")}
              >
                Create your account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[oklch(0.14_0.02_264)] p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <span className="ml-2 text-xs text-slate-400">
                  live-room — two-sum.ts
                </span>
                <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> 2
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    LIVE
                  </span>
                </div>
              </div>
              <pre className="overflow-x-auto text-[11px] leading-relaxed text-slate-300">
                <code>{`function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(nums[i], i);
  }
}

// AI Co-Pilot:
//  Complexity: O(N) time, O(N) space ✓
//  Follow-up: How would this behave with
//  duplicate negative integers?`}</code>
              </pre>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> 3/3 tests passed
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <GitBranch className="h-3 w-3" /> 12 snapshots
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
