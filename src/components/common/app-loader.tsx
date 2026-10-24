"use client";

import { Loader2 } from "lucide-react";

export function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[oklch(0.16_0.02_264)] text-slate-200">
      <div className="relative">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center glow-primary">
          <Loader2 className="h-6 w-6 animate-spin text-white" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium tracking-wide">
          Loading Sanchivue
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Warming up the IDE, AI co-pilot &amp; collab engine…
        </p>
      </div>
    </div>
  );
}
