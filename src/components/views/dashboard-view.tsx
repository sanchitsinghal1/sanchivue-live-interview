"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  Plus,
  Library,
  Sparkles,
  Users,
  CheckCircle2,
  Clock,
  Code2,
  TrendingUp,
  FileText,
  ChevronRight,
  Loader2,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ViewFrame } from "@/components/common/view-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  difficultyColor,
  statusColor,
  formatRelativeTime,
} from "@/lib/format";
import { isInterviewerRole } from "@/lib/client-constants";
import type {
  InterviewListItem,
  QuestionListItem,
} from "@/lib/client-types";

interface SubmissionHistoryItem {
  id: string;
  questionId: string;
  questionTitle: string;
  questionSlug: string;
  difficulty: string;
  language: string;
  status: string;
  passedCount: number;
  totalCount: number;
  score: number;
  executionTimeMs: number;
  createdAt: string;
}

export function DashboardView() {
  const { user, setView, setActiveQuestionId, setActiveInterviewId } =
    useAppStore();
  const [interviews, setInterviews] = useState<InterviewListItem[]>([]);
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [candidateEmail, setCandidateEmail] = useState("");
  const [questionSelect, setQuestionSelect] = useState("");
  const [creating, setCreating] = useState(false);

  const isInterviewer = user ? isInterviewerRole(user.role) : false;

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const [iv, qb, sub] = await Promise.all([
          api.get<{ items: InterviewListItem[] }>("/interviews"),
          api.get<{ items: QuestionListItem[] }>("/questions?limit=5"),
          api
            .get<{ items: SubmissionHistoryItem[] }>("/submissions/history")
            .catch(() => ({ items: [] as SubmissionHistoryItem[] })),
        ]);
        if (!active) return;
        setInterviews(iv.items);
        setQuestions(qb.items);
        setSubmissions(sub.items);
      } catch {
        toast.error("Failed to load dashboard data.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function createInterview() {
    setCreating(true);
    try {
      const res = await api.post<{ id: string; roomCode: string }>(
        "/interviews",
        {
          candidateEmail: candidateEmail.trim() || undefined,
          questionId: questionSelect || undefined,
        }
      );
      toast.success(`Interview room ${res.roomCode} created.`);
      setScheduleOpen(false);
      setCandidateEmail("");
      setQuestionSelect("");
      setActiveInterviewId(res.id);
      setView("interview-room");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create interview."
      );
    } finally {
      setCreating(false);
    }
  }

  function enterInterview(id: string) {
    setActiveInterviewId(id);
    setView("interview-room");
  }

  function practiceQuestion(id: string) {
    setActiveQuestionId(id);
    setView("question-bank");
  }

  const stats = isInterviewer
    ? [
        {
          label: "Interviews hosted",
          value: interviews.length,
          icon: Users,
          accent: "text-indigo-400",
        },
        {
          label: "Live now",
          value: interviews.filter((i) => i.status === "LIVE").length,
          icon: PlayCircle,
          accent: "text-emerald-400",
        },
        {
          label: "Questions in bank",
          value: questions.length,
          icon: Library,
          accent: "text-amber-400",
        },
      ]
    : [
        {
          label: "Assigned interviews",
          value: interviews.length,
          icon: CalendarClock,
          accent: "text-indigo-400",
        },
        {
          label: "Submissions made",
          value: submissions.length,
          icon: CheckCircle2,
          accent: "text-emerald-400",
        },
        {
          label: "Avg. score",
          value:
            submissions.length > 0
              ? Math.round(
                  submissions.reduce((a, s) => a + s.score, 0) /
                    submissions.length
                ) + "%"
              : "—",
          icon: TrendingUp,
          accent: "text-amber-400",
        },
      ];

  return (
    <ViewFrame>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Greeting */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              {greeting()}, {user?.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isInterviewer
                ? "Run live interviews, generate AI assessments, and review evidence."
                : "Practice in the question bank or join your assigned interview room."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isInterviewer ? (
              <>
                <Button
                  onClick={() => setScheduleOpen(true)}
                  className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule interview
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView("jd-builder")}
                  className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  <Sparkles className="mr-2 h-4 w-4 text-emerald-400" />
                  AI Assessment
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setView("question-bank")}
                className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
              >
                <Code2 className="mr-2 h-4 w-4" />
                Open practice sandbox
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.label}
                className="border-white/10 bg-[oklch(0.19_0.02_264)]"
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-xl bg-white/5 p-3">
                    <Icon className={`h-5 w-5 ${s.accent}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">
                      {s.value}
                    </div>
                    <div className="text-xs text-slate-400">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Interviews */}
          <Card className="border-white/10 bg-[oklch(0.19_0.02_264)] lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">
                  {isInterviewer ? "Hosted interviews" : "Your interviews"}
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Most recent first
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-300"
                disabled
              >
                <FileText className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : interviews.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No interviews yet"
                  desc={
                    isInterviewer
                      ? "Schedule your first interview to get a shareable room code."
                      : "When an interviewer assigns you a room, it will appear here."
                  }
                  action={
                    isInterviewer ? (
                      <Button
                        onClick={() => setScheduleOpen(true)}
                        size="sm"
                        className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white"
                      >
                        <Plus className="mr-1 h-4 w-4" /> Schedule
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <ul className="divide-y divide-white/5">
                  {interviews.slice(0, 6).map((iv) => (
                    <li
                      key={iv.id}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white/5 p-2">
                          <Code2 className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {iv.question?.title || "Open session"}
                            </span>
                            {iv.question && (
                              <Badge
                                variant="outline"
                                className={difficultyColor(iv.question.difficulty)}
                              >
                                {iv.question.difficulty}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono">{iv.roomCode}</span>
                            <span>·</span>
                            <span>
                              {isInterviewer
                                ? iv.candidate?.name || "No candidate assigned"
                                : `With ${iv.interviewer?.name}`}
                            </span>
                            <span>·</span>
                            <span>{formatRelativeTime(iv.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill status={iv.status} />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => enterInterview(iv.id)}
                          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
                        >
                          Enter
                          <ChevronRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            {isInterviewer ? (
              <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
                <CardHeader>
                  <CardTitle className="text-white">Question bank</CardTitle>
                  <CardDescription className="text-slate-400">
                    Pick a problem to start a room
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {questions.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No questions available.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {questions.slice(0, 4).map((q) => (
                        <li key={q.id}>
                          <button
                            onClick={() => practiceQuestion(q.id)}
                            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
                          >
                            <div>
                              <div className="text-sm font-medium text-white">
                                {q.title}
                              </div>
                              <div className="text-xs text-slate-400">
                                {q.tags.slice(0, 2).join(" · ")}
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={difficultyColor(q.difficulty)}
                            >
                              {q.difficulty}
                            </Badge>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView("question-bank")}
                    className="mt-3 w-full text-slate-300"
                  >
                    Browse all questions
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
                <CardHeader>
                  <CardTitle className="text-white">Recent submissions</CardTitle>
                  <CardDescription className="text-slate-400">
                    Your last attempts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submissions.length === 0 ? (
                    <p className="text-sm text-slate-400">
                      No submissions yet. Try the practice sandbox.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {submissions.slice(0, 5).map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">
                              {s.questionTitle}
                            </div>
                            <div className="text-xs text-slate-400">
                              {s.language} · {formatRelativeTime(s.createdAt)}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={statusColor(s.status)}
                          >
                            {s.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Schedule interview dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="border-white/10 bg-[oklch(0.19_0.02_264)] text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule interview</DialogTitle>
            <DialogDescription className="text-slate-400">
              Generate a shareable room code. The candidate can be assigned now
              or join later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cand">Candidate email (optional)</Label>
              <Input
                id="cand"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="candidate@demo.dev"
                className="border-white/10 bg-white/5 text-slate-100"
              />
              <p className="text-xs text-slate-400">
                Leave blank to create an open room and assign later.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="q">Starting question (optional)</Label>
              <select
                id="q"
                value={questionSelect}
                onChange={(e) => setQuestionSelect(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              >
                <option value="">No starting question</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title} ({q.difficulty})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setScheduleOpen(false)}
              className="text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={createInterview}
              disabled={creating}
              className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
            >
              {creating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ViewFrame>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    SCHEDULED: {
      label: "Scheduled",
      cls: "text-slate-300 bg-white/5 border-white/15",
    },
    LIVE: {
      label: "LIVE",
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40",
    },
    ENDED: {
      label: "Ended",
      cls: "text-slate-400 bg-white/5 border-white/10",
    },
  };
  const s = map[status] || map.SCHEDULED;
  return (
    <Badge variant="outline" className={s.cls}>
      {status === "LIVE" && (
        <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      )}
      {s.label}
    </Badge>
  );
}

function EmptyState({
  icon: Icon,
  title,
  desc,
  action,
}: {
  icon: typeof Clock;
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center">
      <div className="rounded-xl bg-white/5 p-4">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <div>
        <p className="font-medium text-slate-200">{title}</p>
        <p className="mt-1 text-sm text-slate-400">{desc}</p>
      </div>
      {action}
    </div>
  );
}
