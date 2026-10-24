"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Slider } from "@/components/ui/slider";
import { RUBRIC_CRITERIA } from "@/lib/client-constants";
import type { RubricScores } from "@/lib/client-types";

interface RubricScorecardProps {
  interviewId: string;
  initialDraft?: RubricScores;
  className?: string;
}

type RubricKey = keyof RubricScores;

/**
 * Interactive 0–10 rubric scorecard for the interviewer. Each slider change is
 * debounced (400ms) and PATCHed to /interviews/[id] so the draft is preserved
 * across reloads and ready for the post-session evaluation report.
 */
export function RubricScorecard({
  interviewId,
  initialDraft,
  className,
}: RubricScorecardProps) {
  const [scores, setScores] = useState<RubricScores>(
    initialDraft || {
      problemSolving: 0,
      cleanCode: 0,
      optimization: 0,
      communication: 0,
      edgeCases: 0,
    }
  );
  const [saved, setSaved] = useState<boolean>(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest scores in a ref so the debounced PATCH reads fresh values.
  const scoresRef = useRef(scores);
  useEffect(() => {
    scoresRef.current = scores;
  }, [scores]);

  // Reset local state when the initial draft or interview changes. Use the
  // React "adjust state when prop changes" pattern (sync during render).
  const draftKey = `${interviewId}:${JSON.stringify(initialDraft)}`;
  const [prevDraftKey, setPrevDraftKey] = useState(draftKey);
  if (draftKey !== prevDraftKey) {
    setPrevDraftKey(draftKey);
    if (initialDraft) setScores(initialDraft);
    setSaved(true);
  }

  // Cleanup the debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function update(key: RubricKey, value: number) {
    setScores((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        await api.patch(`/interviews/${interviewId}`, {
          rubricDraft: scoresRef.current,
        });
        setSaved(true);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not save rubric."
        );
        setSaved(true);
      }
    }, 400);
  }

  const total =
    scores.problemSolving +
    scores.cleanCode +
    scores.optimization +
    scores.communication +
    scores.edgeCases;

  return (
    <div className={"flex flex-col " + (className || "")}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Rubric scorecard
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">
            {total}
            <span className="text-slate-500">/50</span>
          </span>
          <span
            className={
              "h-1.5 w-1.5 rounded-full " +
              (saved ? "bg-emerald-400" : "bg-amber-400 animate-pulse")
            }
            title={saved ? "Saved" : "Saving…"}
          />
        </div>
      </div>
      <div className="space-y-3 px-3 py-3">
        {RUBRIC_CRITERIA.map((c) => {
          const key = c.key as RubricKey;
          const value = scores[key];
          const pct = (value / 10) * 100;
          return (
            <div key={c.key}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-slate-200">
                    {c.label}
                  </div>
                  <div className="truncate text-[10px] text-slate-500">
                    {c.description}
                  </div>
                </div>
                <span className="shrink-0 font-mono text-xs font-bold text-indigo-300">
                  {value}
                </span>
              </div>
              <Slider
                min={0}
                max={10}
                step={1}
                value={[value]}
                onValueChange={(v) => update(key, v[0] ?? 0)}
                className="h-1.5"
              />
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
