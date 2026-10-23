"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Code2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatDateTime } from "@/lib/format";
import type { CodeSnapshot } from "@/lib/client-types";

// Monaco editor is heavy and DOM-driven — load it client-side only.
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface CodeReplayPlayerProps {
  snapshots: CodeSnapshot[];
}

// Auto-advance interval (ms) when "Play" is engaged.
const ADVANCE_MS = 800;

/**
 * Code Replay Timeline Player.
 *
 * Lets a reviewer scrub through the candidate's saved code snapshots
 * captured during the live interview. A read-only Monaco editor displays
 * the code at the current frame; play / pause / step controls mirror a
 * typical video replay experience.
 */
export function CodeReplayPlayer({ snapshots }: CodeReplayPlayerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [snapshotsKey, setSnapshotsKey] = useState(snapshots);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset cursor + playback state whenever the snapshot list identity changes.
  // Uses the "adjust state during render" pattern recommended by React 19 to
  // avoid cascading renders from setState-in-effect.
  if (snapshotsKey !== snapshots) {
    setSnapshotsKey(snapshots);
    setIndex(0);
    setPlaying(false);
  }

  // Drive the auto-advance timer.
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!playing || snapshots.length === 0) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => {
        if (prev + 1 >= snapshots.length) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, ADVANCE_MS);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, snapshots.length]);

  const goPrev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);
  const goNext = useCallback(() => {
    setIndex((i) => Math.min(snapshots.length - 1, i + 1));
  }, [snapshots.length]);

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-white/10 bg-black/20 px-4 py-10 text-center">
        <div className="rounded-xl bg-white/5 p-3">
          <Code2 className="h-6 w-6 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300">
            No code snapshots recorded
          </p>
          <p className="mt-1 text-xs text-slate-400">
            The candidate did not save any code history for this session.
          </p>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(index, snapshots.length - 1);
  const current = snapshots[safeIndex];
  const eventTypeColor =
    current.eventType === "submit"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      : current.eventType === "run"
      ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
      : "text-slate-300 bg-white/5 border-white/15";

  return (
    <div className="space-y-3">
      {/* Transport controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPlaying((p) => !p)}
          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          {playing ? (
            <Pause className="mr-1 h-3.5 w-3.5" />
          ) : (
            <Play className="mr-1 h-3.5 w-3.5" />
          )}
          {playing ? "Pause" : "Play"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={goPrev}
          disabled={safeIndex === 0}
          className="text-slate-300 hover:bg-white/5"
        >
          <SkipBack className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={goNext}
          disabled={safeIndex >= snapshots.length - 1}
          className="text-slate-300 hover:bg-white/5"
        >
          <SkipForward className="h-3.5 w-3.5" />
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <Badge variant="outline" className={eventTypeColor}>
            {current.eventType}
          </Badge>
          <span className="font-mono text-slate-400">
            {formatDateTime(current.timestamp)}
          </span>
          <span className="text-slate-500">
            · {safeIndex + 1}/{snapshots.length}
          </span>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="px-1">
        <Slider
          value={[safeIndex]}
          min={0}
          max={Math.max(0, snapshots.length - 1)}
          step={1}
          onValueChange={(v) => {
            const next = Array.isArray(v) ? v[0] : v;
            if (typeof next === "number") setIndex(next);
          }}
          className="py-1"
        />
      </div>

      {/* Read-only editor */}
      <div className="h-[340px] overflow-hidden rounded-md border border-white/10 bg-[oklch(0.15_0.02_264)]">
        <MonacoEditor
          height="100%"
          language={current.language || "javascript"}
          theme="vs-dark"
          value={current.code || ""}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "var(--font-geist-mono), monospace",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 8 },
          }}
        />
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-[oklch(0.15_0.02_264)] text-slate-500">
      <RefreshCw className="h-4 w-4 animate-spin" />
    </div>
  );
}
