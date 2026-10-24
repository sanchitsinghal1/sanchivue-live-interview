"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  ArrowLeft,
  ShieldAlert,
  MousePointerClick,
  Clipboard,
  Maximize,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Save,
  Loader2,
  ClipboardList,
  MessageSquare,
  Clock,
  Code2,
  Gauge,
  ShieldCheck,
  User,
  Mail,
  KeyRound,
  CalendarRange,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ViewFrame } from "@/components/common/view-frame";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  formatRelativeTime,
  formatDateTime,
  formatDurationMs,
  severityColor,
  recommendationColor,
} from "@/lib/format";
import { RUBRIC_CRITERIA, isInterviewerRole } from "@/lib/client-constants";
import { CodeReplayPlayer } from "@/components/interview-room/code-replay-player";
import type {
  RubricScores,
  ProctoringLog,
  CodeSnapshot,
  ChatMessage,
} from "@/lib/client-types";

// ---- Local type aliases mirroring the API contract -------------------------

interface InterviewDetail {
  id: string;
  roomCode: string;
  status: string;
  interviewer: { id: string; name: string; email: string } | null;
  candidate: { id: string; name: string; email: string } | null;
  question: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  } | null;
  chatLog: ChatMessage[];
  proctoringLogs: ProctoringLog[];
  snapshots: CodeSnapshot[];
  rubricDraft: RubricScores;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

interface Evaluation {
  id: string;
  rubricScores: RubricScores;
  aiSummary: string;
  interviewerNotes: string;
  recommendation: string;
  createdAt: string;
  // strengths/concerns are only returned by the POST endpoint; GET does not
  // include them, so they're optional here.
  strengths?: string[];
  concerns?: string[];
}

interface EvaluationResponse {
  evaluation: Evaluation | null;
}

interface SaveEvaluationResponse {
  evaluation: Evaluation;
}

// ---- Helpers ---------------------------------------------------------------

const EMPTY_RUBRIC: RubricScores = {
  problemSolving: 0,
  cleanCode: 0,
  optimization: 0,
  communication: 0,
  edgeCases: 0,
};

const MAX_RUBRIC_TOTAL = 50;

function rubricSum(r: RubricScores): number {
  return (
    Number(r.problemSolving) +
    Number(r.cleanCode) +
    Number(r.optimization) +
    Number(r.communication) +
    Number(r.edgeCases)
  );
}

function clampScore(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(10, Math.round(v)));
}

function statusPillClass(status: string): string {
  switch (status) {
    case "LIVE":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/40";
    case "ENDED":
      return "text-slate-400 bg-white/5 border-white/10";
    case "SCHEDULED":
    default:
      return "text-slate-300 bg-white/5 border-white/15";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "LIVE":
      return "Live";
    case "ENDED":
      return "Ended";
    case "SCHEDULED":
      return "Scheduled";
    default:
      return status;
  }
}

function recommendationLabel(rec: string): string {
  return rec
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function proctoringIcon(type: ProctoringLog["type"]) {
  switch (type) {
    case "tab-switch":
      return MousePointerClick;
    case "window-blur":
      return ShieldAlert;
    case "paste-anomaly":
      return Clipboard;
    case "fullscreen-exit":
      return Maximize;
    default:
      return ShieldAlert;
  }
}

// ---- Main view -------------------------------------------------------------

export function EvaluationReportView() {
  const { user, activeInterviewId, setView } = useAppStore();
  const isInterviewer = user ? isInterviewerRole(user.role) : false;

  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [rubric, setRubric] = useState<RubricScores>(EMPTY_RUBRIC);
  const [notes, setNotes] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch interview detail + evaluation in parallel.
  useEffect(() => {
    if (!activeInterviewId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    (async () => {
      try {
        const [iv, ev] = await Promise.all([
          api.get<InterviewDetail>(`/interviews/${activeInterviewId}`),
          api.get<EvaluationResponse>(`/evaluations/${activeInterviewId}`),
        ]);
        if (!active) return;

        // Authorization: candidate viewing someone else's interview, or a
        // non-participant trying to peek — bounce them back to the dashboard.
        const isParticipant =
          (iv.interviewer && iv.interviewer.id === user?.id) ||
          (iv.candidate && iv.candidate.id === user?.id) ||
          isInterviewer;
        if (!isParticipant) {
          toast.error("You are not a participant of this interview.");
          setFetchError(true);
          setView("dashboard");
          return;
        }

        setInterview(iv);
        const e = ev.evaluation;
        setEvaluation(e);
        setStrengths([]);
        setConcerns([]);
        if (e) {
          setRubric(e.rubricScores || EMPTY_RUBRIC);
          setNotes(e.interviewerNotes || "");
        } else {
          // Initialize editable rubric from the interview's rubricDraft so the
          // interviewer's in-session score slider state isn't lost.
          setRubric(iv.rubricDraft || EMPTY_RUBRIC);
          setNotes("");
        }
      } catch (err) {
        if (!active) return;
        toast.error(
          err instanceof Error ? err.message : "Failed to load evaluation."
        );
        setFetchError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeInterviewId, user?.id, isInterviewer, setView]);

  // passedRatio for the AI summary call.
  //
  // The Evaluation Report view does not fetch the latest hidden-test submission
  // result (that lives on the submissions endpoint and would complicate the
  // demo). Per the task spec, we derive a reasonable passedRatio directly from
  // the rubric: Math.round((sum of rubric scores) / 50 * 100). We use the
  // live editable `rubric` state so the AI summary reflects whatever the
  // interviewer is about to save (or the previously saved rubric for
  // candidates viewing a published evaluation).
  const passedRatio = useMemo(() => {
    const source = evaluation?.rubricScores || rubric || EMPTY_RUBRIC;
    const sum = rubricSum(source);
    return Math.round((sum / MAX_RUBRIC_TOTAL) * 100);
  }, [evaluation, rubric]);

  const rubricTotal = useMemo(() => rubricSum(rubric), [rubric]);
  const rubricPct = Math.round((rubricTotal / MAX_RUBRIC_TOTAL) * 100);

  const radarData = useMemo(
    () =>
      RUBRIC_CRITERIA.map((c) => ({
        criterion: c.label,
        score: Number(rubric[c.key as keyof RubricScores] ?? 0),
      })),
    [rubric]
  );

  const handleScoreChange = useCallback(
    (key: keyof RubricScores, value: number) => {
      setRubric((prev) => ({ ...prev, [key]: clampScore(value) }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!activeInterviewId) return;
    setSaving(true);
    try {
      const res = await api.post<SaveEvaluationResponse>(
        `/evaluations/${activeInterviewId}`,
        {
          rubricScores: rubric,
          interviewerNotes: notes,
          passedRatio,
        }
      );
      setEvaluation(res.evaluation);
      setStrengths(res.evaluation.strengths || []);
      setConcerns(res.evaluation.concerns || []);
      toast.success("Evaluation saved — AI summary regenerated.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not save evaluation."
      );
    } finally {
      setSaving(false);
    }
  }, [activeInterviewId, rubric, notes, passedRatio]);

  // ---- Render states -------------------------------------------------------

  if (!activeInterviewId) {
    return (
      <ViewFrame>
        <EmptyEvaluationState />
      </ViewFrame>
    );
  }

  if (loading) {
    return (
      <ViewFrame>
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="mb-6 h-28 w-full rounded-xl" />
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
              <Skeleton className="h-72 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-60 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </ViewFrame>
    );
  }

  if (fetchError || !interview) {
    return (
      <ViewFrame>
        <EmptyEvaluationState />
      </ViewFrame>
    );
  }

  const recommendation =
    evaluation?.recommendation || recommendationFromPct(rubricPct);
  const durationMs =
    interview.startedAt && interview.endedAt
      ? new Date(interview.endedAt).getTime() -
        new Date(interview.startedAt).getTime()
      : 0;

  const aiSummaryAvailable = Boolean(
    evaluation?.aiSummary && evaluation.aiSummary.trim().length > 0
  );

  return (
    <ViewFrame>
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
              <ClipboardList className="h-7 w-7 text-indigo-400" />
              Evaluation Report
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isInterviewer
                ? "Score the rubric and generate an AI evidence summary for this interview."
                : "Read-only view of your interviewer's published evaluation."}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setView("dashboard")}
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </div>

        {/* Header card */}
        <Card className="mb-6 border-white/10 bg-[oklch(0.19_0.02_264)]">
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <HeaderField
                  icon={User}
                  label="Candidate"
                  value={interview.candidate?.name || "Unassigned"}
                  sub={interview.candidate?.email || "—"}
                />
                <HeaderField
                  icon={User}
                  label="Interviewer"
                  value={interview.interviewer?.name || "Unassigned"}
                  sub={interview.interviewer?.email || "—"}
                />
                <HeaderField
                  icon={KeyRound}
                  label="Room code"
                  value={interview.roomCode}
                  mono
                />
                <HeaderField
                  icon={CalendarRange}
                  label="Session window"
                  value={
                    interview.startedAt
                      ? `${formatDateTime(interview.startedAt)} → ${
                          interview.endedAt
                            ? formatDateTime(interview.endedAt)
                            : "ongoing"
                        }`
                      : "Not started"
                  }
                />
                <HeaderField
                  icon={Clock}
                  label="Duration"
                  value={
                    durationMs > 0 ? formatDurationMs(durationMs) : "—"
                  }
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs uppercase tracking-wide text-slate-500">
                    Status / Recommendation
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={statusPillClass(interview.status)}>
                      {statusLabel(interview.status)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={recommendationColor(recommendation)}
                    >
                      {recommendationLabel(recommendation)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column (span 2) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Rubric card */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Gauge className="h-5 w-5 text-emerald-400" />
                  Structured rubric scorecard
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {isInterviewer
                    ? "Drag each slider to score the candidate 0–10 per criterion. The total and percentage update live."
                    : "The interviewer's structured scores across the five evaluation criteria."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {RUBRIC_CRITERIA.map((c) => {
                  const key = c.key as keyof RubricScores;
                  const value = clampScore(Number(rubric[key] ?? 0));
                  return (
                    <div key={c.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {c.label}
                          </div>
                          <div className="text-xs text-slate-500">
                            {c.description}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-white/15 bg-white/5 font-mono text-slate-200"
                        >
                          {value}/10
                        </Badge>
                      </div>
                      {isInterviewer ? (
                        <Slider
                          value={[value]}
                          min={0}
                          max={10}
                          step={1}
                          onValueChange={(v) => {
                            const next = Array.isArray(v) ? v[0] : v;
                            if (typeof next === "number") {
                              handleScoreChange(key, next);
                            }
                          }}
                          className="py-1"
                        />
                      ) : (
                        <Progress
                          value={(value / 10) * 100}
                          className="h-2 bg-white/10"
                        />
                      )}
                    </div>
                  );
                })}
                <Separator className="bg-white/10" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      Total
                    </span>
                    <span className="font-mono text-2xl font-bold text-white">
                      {rubricTotal}
                      <span className="ml-1 text-base text-slate-500">
                        /{MAX_RUBRIC_TOTAL}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={rubricPct}
                      className="h-2 w-40 bg-white/10"
                    />
                    <span className="font-mono text-sm text-emerald-300">
                      {rubricPct}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radar chart card */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Rubric profile
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Five-axis radar visualizing the candidate's strengths and gaps.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      data={radarData}
                      outerRadius="75%"
                    >
                      <defs>
                        <linearGradient
                          id="rubricRadarFill"
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="1"
                        >
                          <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <PolarGrid stroke="rgba(255,255,255,0.12)" />
                      <PolarAngleAxis
                        dataKey="criterion"
                        tick={{
                          fill: "#cbd5e1",
                          fontSize: 11,
                        }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 10]}
                        tickCount={6}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                      />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fill="url(#rubricRadarFill)"
                        fillOpacity={0.65}
                        isAnimationActive
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Code Replay card */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Code2 className="h-5 w-5 text-amber-400" />
                  Code replay timeline
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Scrub through the candidate's saved code snapshots to replay
                  their problem-solving journey.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeReplayPlayer snapshots={interview.snapshots} />
              </CardContent>
            </Card>

            {/* AI Evidence Summary card */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Sparkles className="h-5 w-5 text-emerald-400" />
                    AI evidence summary
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Auto-generated from the rubric, proctoring telemetry, and
                    your notes.
                  </CardDescription>
                </div>
                {isInterviewer && (
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={saving}
                    variant="outline"
                    className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                  >
                    {saving ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-3.5 w-3.5" />
                    )}
                    Regenerate AI summary
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {aiSummaryAvailable ? (
                  <>
                    <div className="rounded-md border border-white/10 bg-black/20 p-4">
                      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-200 scrollbar-thin">
                        {evaluation?.aiSummary}
                      </pre>
                    </div>

                    {strengths.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Strengths
                        </div>
                        <ul className="space-y-1.5">
                          {strengths.map((s, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-200"
                            >
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {concerns.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-amber-300">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Concerns
                        </div>
                        <ul className="space-y-1.5">
                          {concerns.map((c, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-sm text-slate-200"
                            >
                              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="text-xs text-slate-500">
                      Recommendation:{" "}
                      <span className="font-mono text-slate-300">
                        {recommendationLabel(recommendation)}
                      </span>
                      {evaluation?.createdAt && (
                        <>
                          {" · generated "}
                          {formatRelativeTime(evaluation.createdAt)}
                        </>
                      )}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-3 rounded-md border border-white/10 bg-black/20 px-4 py-10 text-center">
                    <div className="rounded-xl bg-white/5 p-3">
                      <Sparkles className="h-6 w-6 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-300">
                        No AI summary generated yet
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {isInterviewer
                          ? "Adjust the rubric, jot down notes, then save to generate an evidence-based AI summary."
                          : "Your interviewer has not published an evaluation for this session yet."}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interviewer-only notes + save */}
                {isInterviewer && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="space-y-2">
                      <Label
                        htmlFor="notes"
                        className="text-xs uppercase tracking-wide text-slate-500"
                      >
                        Interviewer notes
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Capture qualitative observations: communication style, problem decomposition, recovery from bugs, etc."
                        className="border-white/10 bg-white/5 text-sm text-slate-100 scrollbar-thin"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-slate-500">
                        passedRatio sent to AI:{" "}
                        <span className="font-mono text-slate-300">
                          {passedRatio}%
                        </span>
                      </span>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
                      >
                        {saving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save evaluation
                      </Button>
                    </div>
                  </>
                )}

                {/* Candidate-only: read-only interviewer notes */}
                {!isInterviewer && evaluation?.interviewerNotes && (
                  <>
                    <Separator className="bg-white/10" />
                    <div className="space-y-2">
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Interviewer notes
                      </div>
                      <pre className="whitespace-pre-wrap break-words rounded-md border border-white/10 bg-black/20 p-3 text-sm text-slate-200 scrollbar-thin">
                        {evaluation.interviewerNotes}
                      </pre>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Proctoring alerts card */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  Proctoring alerts
                </CardTitle>
                <CardDescription className="text-slate-400">
                  {isInterviewer
                    ? "Telemetry captured from the candidate's browser during the session."
                    : "Visibility restricted to interviewers."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isInterviewer ? (
                  <div className="flex flex-col items-center gap-2 rounded-md border border-white/10 bg-black/20 px-4 py-8 text-center">
                    <ShieldCheck className="h-6 w-6 text-emerald-400/70" />
                    <p className="text-sm text-slate-300">
                      Proctoring telemetry is visible to interviewers
                    </p>
                    <p className="text-xs text-slate-500">
                      Raw proctoring logs are not shown to candidates. Reach out
                      to your recruiter if you have questions.
                    </p>
                  </div>
                ) : interview.proctoringLogs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-4 py-8 text-center">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    <p className="text-sm text-emerald-300">
                      No proctoring alerts
                    </p>
                    <p className="text-xs text-slate-400">
                      The candidate maintained focus for the entire session.
                    </p>
                  </div>
                ) : (
                  <ul className="max-h-80 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                    {interview.proctoringLogs.map((log, i) => {
                      const Icon = proctoringIcon(log.type);
                      return (
                        <li
                          key={i}
                          className="rounded-md border border-white/10 bg-black/20 p-3"
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 rounded-md bg-white/5 p-1.5">
                              <Icon className="h-3.5 w-3.5 text-slate-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
                                  {log.type.replace("-", " ")}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={severityColor(log.severity)}
                                >
                                  {log.severity}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-slate-400">
                                {log.detail}
                              </p>
                              <p className="mt-1 text-[10px] text-slate-500">
                                {formatRelativeTime(log.timestamp)}
                              </p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Session meta card */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ClipboardList className="h-5 w-5 text-indigo-400" />
                  Session meta
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Quick stats for this interview.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <MetaRow
                  icon={Code2}
                  label="Question"
                  value={
                    interview.question?.title || "No question assigned"
                  }
                  sub={
                    interview.question?.difficulty
                      ? interview.question.difficulty
                      : undefined
                  }
                />
                <Separator className="bg-white/10" />
                <MetaRow
                  icon={Code2}
                  label="Code snapshots"
                  value={`${interview.snapshots.length} saved`}
                />
                <Separator className="bg-white/10" />
                <MetaRow
                  icon={MessageSquare}
                  label="Chat messages"
                  value={`${interview.chatLog.length} sent`}
                />
                <Separator className="bg-white/10" />
                <MetaRow
                  icon={Clock}
                  label="Duration"
                  value={
                    durationMs > 0 ? formatDurationMs(durationMs) : "—"
                  }
                  sub={
                    interview.startedAt
                      ? `started ${formatRelativeTime(interview.startedAt)}`
                      : "not started"
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ViewFrame>
  );
}

// ---- Small presentational helpers -----------------------------------------

function recommendationFromPct(pct: number): string {
  if (pct >= 85) return "STRONG_HIRE";
  if (pct >= 65) return "HIRE";
  if (pct >= 45) return "LEAN_HIRE";
  return "NO_HIRE";
}

function EmptyEvaluationState() {
  const { setView } = useAppStore();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <div className="rounded-2xl bg-white/5 p-5">
        <ClipboardList className="h-8 w-8 text-slate-400" />
      </div>
      <div>
        <p className="text-lg font-semibold text-white">
          No evaluation selected
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Open an interview from the dashboard to view its evaluation report.
        </p>
      </div>
      <Button
        onClick={() => setView("dashboard")}
        className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to dashboard
      </Button>
    </div>
  );
}

function HeaderField({
  icon: Icon,
  label,
  value,
  sub,
  mono,
}: {
  icon: typeof User;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <span
        className={
          "text-sm font-medium text-slate-100 " +
          (mono ? "font-mono" : "")
        }
      >
        {value}
      </span>
      {sub && (
        <span className="font-mono text-xs text-slate-500">{sub}</span>
      )}
    </div>
  );
}

function MetaRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof User;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-white/5 p-2">
        <Icon className="h-4 w-4 text-slate-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="truncate text-sm font-medium text-slate-100">
          {value}
        </div>
        {sub && (
          <div className="truncate text-xs text-slate-500">{sub}</div>
        )}
      </div>
    </div>
  );
}
