"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Bug,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  Clock,
  Gauge,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CopilotInsight } from "@/lib/client-types";

interface AiCopilotDrawerProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Getter for the current code & question statement. */
  getCode: () => { code: string; questionStatement: string };
}

/**
 * Right-side slide-in Sheet (interviewer-only) that calls the AI Co-Pilot
 * endpoint with the candidate's current code + question statement and renders
 * the returned complexity, bugs, edge cases, follow-up questions, and hint.
 */
export function AiCopilotDrawer({
  open,
  onOpenChange,
  getCode,
}: AiCopilotDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<CopilotInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  async function analyze() {
    const { code, questionStatement } = getCode();
    if (!code || !code.trim()) {
      toast.error("No code to analyze yet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post<CopilotInsight>("/ai/copilot", {
        code,
        questionStatement,
      });
      setInsight(res);
      toast.success("AI Co-Pilot analysis ready.");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "AI analysis failed.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, idx: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-white/10 bg-[oklch(0.18_0.02_264)] p-0 text-slate-200 sm:max-w-md"
      >
        <SheetHeader className="border-b border-white/10 px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            AI Co-Pilot
          </SheetTitle>
          <SheetDescription className="text-slate-400">
            Live Big-O analysis, bug detection, edge cases, and follow-up
            questions tailored to the candidate's exact code.
          </SheetDescription>
        </SheetHeader>

        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <Button
            size="sm"
            onClick={analyze}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3.5 w-3.5" />
            )}
            Analyze candidate code
          </Button>
          {insight && !loading && (
            <Button
              size="sm"
              variant="ghost"
              onClick={analyze}
              className="text-slate-300"
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {error && (
              <div className="mb-3 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            {loading && !insight && <InsightSkeleton />}

            {!loading && !insight && !error && (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-400">
                <Sparkles className="h-8 w-8 opacity-50" />
                <p>Click “Analyze candidate code” to surface live insights.</p>
              </div>
            )}

            {insight && (
              <div className="space-y-4">
                {/* Complexity */}
                <Section
                  icon={<Gauge className="h-3.5 w-3.5" />}
                  title="Complexity"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      Time: {insight.complexity.time}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    >
                      Time-Space: {insight.complexity.space}
                    </Badge>
                  </div>
                </Section>

                {/* Bugs */}
                <Section
                  icon={<Bug className="h-3.5 w-3.5" />}
                  title="Potential bugs"
                >
                  {insight.bugs.length === 0 ? (
                    <Empty>None detected. Looks clean!</Empty>
                  ) : (
                    <ul className="space-y-1.5">
                      {insight.bugs.map((b, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-2.5 py-1.5 text-xs text-rose-200"
                        >
                          <Bug className="mt-0.5 h-3 w-3 shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Edge cases */}
                <Section
                  icon={<AlertTriangle className="h-3.5 w-3.5" />}
                  title="Edge cases"
                >
                  {insight.edgeCases.length === 0 ? (
                    <Empty>None flagged.</Empty>
                  ) : (
                    <ul className="space-y-1">
                      {insight.edgeCases.map((e, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-slate-300"
                        >
                          <span className="mt-0.5 text-amber-400">▸</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Section>

                {/* Follow-up questions */}
                <Section
                  icon={<HelpCircle className="h-3.5 w-3.5" />}
                  title="Follow-up questions"
                >
                  {insight.followUpQuestions.length === 0 ? (
                    <Empty>None suggested.</Empty>
                  ) : (
                    <ol className="space-y-1.5">
                      {insight.followUpQuestions.map((q, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5"
                        >
                          <span className="text-[10px] font-semibold text-indigo-400">
                            {i + 1}.
                          </span>
                          <span className="flex-1 text-xs text-slate-200">
                            {q}
                          </span>
                          <button
                            onClick={() => copyToClipboard(q, i)}
                            className="text-slate-400 hover:text-white"
                            aria-label="Copy question"
                          >
                            {copiedIdx === i ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </Section>

                {/* Hint */}
                {insight.hint && (
                  <Section
                    icon={<Lightbulb className="h-3.5 w-3.5" />}
                    title="Suggested hint"
                  >
                    <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                      {insight.hint}
                    </div>
                  </Section>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-400">
      {children}
    </div>
  );
}

function InsightSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-md border border-white/10 bg-white/5 p-3"
        >
          <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
