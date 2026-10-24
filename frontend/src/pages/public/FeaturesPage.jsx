import { Link } from 'react-router-dom';
import {
  Code2,
  Bot,
  Shield,
  Users,
  Sparkles,
  GitBranch,
  Video,
  PenTool,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Code2,
    title: 'Live Collaborative IDE',
    desc: 'Monaco editor with real-time code sync, presence cursors, language switching, and shared test-case panels.',
    points: [
      'Real Monaco editor — same engine that powers VS Code',
      'Presence cursors show every participant in real time',
      '8 languages: JavaScript, TypeScript, Python, Java, C++, C, Go, Rust',
      'Per-language starter code',
    ],
  },
  {
    icon: Bot,
    title: 'AI Co-Pilot',
    desc: 'Interviewer-only assistant that analyzes complexity, surfaces bugs, suggests edge cases, and proposes follow-up questions.',
    points: [
      'Time/space complexity analysis',
      'Potential-bug detection with explanations',
      'Edge case checklist',
      'Follow-up question generator',
      'Hint generator',
    ],
  },
  {
    icon: Shield,
    title: 'Sandboxed Execution',
    desc: 'Run candidate code in isolated containers with strict time/memory limits. Hidden tests stay hidden.',
    points: [
      'Per-language runtime with CPU + memory caps',
      'Public + hidden test cases',
      'Candidates never see hidden tests',
      'stdout/stderr capture',
    ],
  },
  {
    icon: Users,
    title: 'Anti-Cheat Proctoring',
    desc: 'Tab-switch, window-blur, large paste, and fullscreen-exit events are logged to the report timeline.',
    points: [
      'Tab-switch detection',
      'Window blur tracking',
      'Large paste anomaly alerts',
      'Fullscreen exit logging',
      'Severity-tagged event timeline',
    ],
  },
  {
    icon: Sparkles,
    title: 'JD-Driven Assessment',
    desc: 'Paste a job description and get an AI-generated assessment blueprint — rubric, questions, and focus areas.',
    points: [
      'Paste a JD, get a structured assessment plan',
      'Suggested focus areas + difficulty',
      'Rubric seeds automatically',
    ],
  },
  {
    icon: GitBranch,
    title: 'Code Replay',
    desc: 'Every keystroke snapshot is saved. Scrub the timeline in the report to relive the candidate\'s thought process.',
    points: [
      'Auto-snapshot every 15s + on every run/submit',
      'Scrub timeline with play/pause + step buttons',
      'Read-only Monaco renders each frame',
    ],
  },
  {
    icon: Video,
    title: 'WebRTC Video & Screen Share',
    desc: 'Built-in audio/video grid with mute/cam/screen-share toggles. Signaling relayed over the collab socket.',
    points: [
      'getUserMedia camera + mic',
      'Mute / camera-off / screen-share toggles',
      'Tile per participant with role badges',
      'Graceful denial handling',
    ],
  },
  {
    icon: PenTool,
    title: 'Shared Whiteboard',
    desc: 'Canvas with pen, eraser, line, rectangle, and circle tools — synced live via the collab socket.',
    points: [
      'Pen, eraser, line, rect, circle tools',
      '5-color palette + undo + clear',
      'Live sync via socket',
      'Crisp at any resolution',
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold text-slate-50">Features</h1>
        <p className="mt-3 text-slate-400">
          Every piece of the loop — from question bank to debrief — in one
          workspace. No more tab juggling.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="card p-6 transition hover:border-slate-700 hover:shadow-glow"
          >
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-brand-indigo/10 text-brand-indigo">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {f.points.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-1.5 text-xs text-slate-300"
                >
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-emerald" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link to="/register" className="btn-primary">
          Start a free interview <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
