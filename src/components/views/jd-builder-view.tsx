"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  FileText,
  CheckCircle2,
  Wand2,
  ListChecks,
  Target,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ViewFrame } from "@/components/common/view-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { difficultyColor } from "@/lib/format";
import type { AssessmentBlueprint } from "@/lib/client-types";

const SAMPLE_JD = `Senior Backend Engineer — Payments Platform

We're looking for a senior engineer to design and scale our high-throughput
payments pipeline. You'll own distributed-systems design, data consistency,
and reliability for services processing millions of transactions/day.

Required: strong CS fundamentals in data structures & algorithms, experience
with distributed systems, concurrency, and database internals. Comfort with
system design trade-offs (CAP, consistency models) is a must.`;

export function JdBuilderView() {
  const { user } = useAppStore();
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<AssessmentBlueprint | null>(null);

  async function generate() {
    if (jd.trim().length < 20) {
      toast.error("Please paste a more detailed job description.");
      return;
    }
    setLoading(true);
    setBlueprint(null);
    try {
      const res = await api.post<AssessmentBlueprint>("/ai/assessment", { jd });
      setBlueprint(res);
      toast.success("Assessment blueprint generated!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ViewFrame>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
            <Sparkles className="h-7 w-7 text-emerald-400" />
            AI Assessment Builder
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Paste a job description — the AI returns recommended DSA topics, 3
            tailored coding problems with test cases, and a custom rubric.
          </p>
        </div>

        {/* Input */}
        <Card className="mb-6 border-white/10 bg-[oklch(0.19_0.02_264)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-indigo-400" />
              Job description
            </CardTitle>
            <CardDescription className="text-slate-400">
              The more detail you provide, the sharper the generated assessment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jd">Paste JD here</Label>
              <Textarea
                id="jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                rows={8}
                placeholder="Paste the full job description…"
                className="border-white/10 bg-white/5 font-mono text-sm text-slate-100 scrollbar-thin"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={generate}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate blueprint
              </Button>
              <Button
                variant="outline"
                onClick={() => setJd(SAMPLE_JD)}
                className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
              >
                Use sample JD
              </Button>
              {jd && (
                <span className="text-xs text-slate-400">
                  {jd.length} chars
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {loading && (
          <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
              <p className="text-sm text-slate-300">
                The AI is analyzing the JD and crafting problems…
              </p>
            </CardContent>
          </Card>
        )}

        {/* Blueprint */}
        {blueprint && !loading && (
          <div className="space-y-6">
            {/* Summary */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Target className="h-5 w-5 text-emerald-400" />
                  {blueprint.title}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {blueprint.summary}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <Layers className="h-3.5 w-3.5" />
                  Recommended topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {blueprint.recommendedTopics.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rubric weights */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ListChecks className="h-5 w-5 text-amber-400" />
                  Rubric weights
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Weighted scoring across the structured rubric.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(blueprint.rubricWeights).map(([k, v]) => (
                    <div key={k}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="capitalize text-slate-300">{k}</span>
                        <span className="text-slate-400">{v}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500"
                          style={{ width: `${v}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Questions */}
            <div className="space-y-4">
              {blueprint.questions.map((q, i) => (
                <Card key={i} className="border-white/10 bg-[oklch(0.19_0.02_264)]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        {i + 1}. {q.title}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={difficultyColor(q.difficulty)}
                      >
                        {q.difficulty}
                      </Badge>
                    </div>
                    <CardDescription className="text-slate-400">
                      Optimal: {q.optimalTime} time · {q.optimalSpace} space
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
                      {q.statement}
                    </pre>
                    <div className="flex flex-wrap gap-1.5">
                      {q.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {q.publicTests.length > 0 && (
                      <div className="rounded-md border border-white/10 bg-black/20 p-3">
                        <div className="mb-1 text-xs font-medium text-slate-400">
                          Sample public test case
                        </div>
                        <div className="font-mono text-xs text-slate-300">
                          input: {q.publicTests[0].input}
                        </div>
                        <div className="font-mono text-xs text-emerald-300">
                          expected: {q.publicTests[0].expectedOutput}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        {q.publicTests.length} public tests
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-amber-400" />
                        {q.hiddenTests.length} hidden tests
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </ViewFrame>
  );
}
