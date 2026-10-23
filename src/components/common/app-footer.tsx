"use client";

import { Code2, Github, Heart } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[oklch(0.13_0.02_264)]">
      <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-2 px-4 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-emerald-500">
            <Code2 className="h-3 w-3 text-white" />
          </span>
          <span>
            LiveInterview Platform — real-time technical interviews with AI
            co-pilot.
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            Built with <Heart className="h-3 w-3 text-rose-400" /> Next.js ·
            Prisma · Socket.io · z-ai-web-dev-sdk
          </span>
          <span className="flex items-center gap-1">
            <Github className="h-3 w-3" />
            {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
}
