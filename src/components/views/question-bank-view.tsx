"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Loader2,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  Code2,
  Wand2,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { ViewFrame } from "@/components/common/view-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  difficultyColor,
  formatRelativeTime,
} from "@/lib/format";
import { isInterviewerRole } from "@/lib/client-constants";
import { PracticePanel } from "@/components/views/practice-panel";
import type { QuestionListItem } from "@/lib/client-types";

const DIFFICULTIES = ["", "Easy", "Medium", "Hard"];
const ALL_TAGS = [
  "Arrays",
  "Hashing",
  "Strings",
  "Stack",
  "Sliding Window",
  "Sorting",
  "Design",
  "Linked List",
  "Trees",
  "Graphs",
  "Dynamic Programming",
  "System Design",
];

export function QuestionBankView() {
  const { user, activeQuestionId, setActiveQuestionId } = useAppStore();
  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QuestionListItem | null>(null);
  const [genOpen, setGenOpen] = useState(false);

  const isInterviewer = user ? isInterviewerRole(user.role) : false;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
        role: user?.role || "candidate",
      });
      if (difficulty) params.set("difficulty", difficulty);
      if (tag) params.set("tag", tag);
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get<{
        items: QuestionListItem[];
        total: number;
        totalPages: number;
      }>(`/questions?${params.toString()}`);
      setQuestions(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      toast.error("Failed to load questions.");
    } finally {
      setLoading(false);
    }
  }, [page, difficulty, tag, search, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  // When a question is pre-selected from the dashboard, open it.
  useEffect(() => {
    if (activeQuestionId && questions.length > 0) {
      const q = questions.find((x) => x.id === activeQuestionId);
      if (q) setSelected(q);
    }
  }, [activeQuestionId, questions]);

  function openQuestion(q: QuestionListItem) {
    setSelected(q);
    setActiveQuestionId(q.id);
  }

  return (
    <ViewFrame>
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Library className="h-6 w-6 text-indigo-400" />
              Question Bank
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {total} curated DSA problems · practice with sandboxed execution
            </p>
          </div>
          {isInterviewer && (
            <Button
              onClick={() => setGenOpen(true)}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              AI Question Generator
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* List + filters */}
          <div className="space-y-4">
            {/* Filters */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardContent className="space-y-3 p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search problems…"
                    className="border-white/10 bg-white/5 pl-9 text-slate-100"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-slate-500" />
                  <select
                    value={difficulty}
                    onChange={(e) => {
                      setDifficulty(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d || "All difficulties"}
                      </option>
                    ))}
                  </select>
                  <select
                    value={tag}
                    onChange={(e) => {
                      setTag(e.target.value);
                      setPage(1);
                    }}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
                  >
                    <option value="">All tags</option>
                    {ALL_TAGS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* List */}
            <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-400">
                    <Code2 className="h-6 w-6 opacity-50" />
                    No problems match your filters.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {questions.map((q) => {
                      const active = selected?.id === q.id;
                      return (
                        <li key={q.id}>
                          <button
                            onClick={() => openQuestion(q)}
                            className={
                              "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors " +
                              (active
                                ? "bg-indigo-500/10"
                                : "hover:bg-white/5")
                            }
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate font-medium text-white">
                                  {q.title}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={difficultyColor(q.difficulty)}
                                >
                                  {q.difficulty}
                                </Badge>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
                                {q.tags.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded bg-white/5 px-1.5 py-0.5"
                                  >
                                    {t}
                                  </span>
                                ))}
                                <span className="ml-auto">
                                  {q.publicTests.length} public ·{" "}
                                  {q.hiddenTests.length} hidden tests
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
                  <span className="text-xs text-slate-400">
                    Page {page} of {Math.max(1, totalPages)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="border-white/10 bg-white/5 text-slate-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="border-white/10 bg-white/5 text-slate-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Practice panel */}
          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]">
            {selected ? (
              <Card className="h-full overflow-hidden border-white/10 bg-[oklch(0.18_0.02_264)]">
                <PracticePanel question={selected} />
              </Card>
            ) : (
              <Card className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 border-white/10 bg-[oklch(0.19_0.02_264)] text-center">
                <div className="rounded-xl bg-white/5 p-4">
                  <Code2 className="h-7 w-7 text-indigo-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-200">
                    Select a problem to practice
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    The sandboxed IDE runs your code against public + hidden test
                    cases with timing &amp; memory tracking.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {isInterviewer && (
        <AiQuestionGeneratorDialog open={genOpen} onOpenChange={setGenOpen} onCreated={load} />
      )}
    </ViewFrame>
  );
}

function AiQuestionGeneratorDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<{
    title: string;
    statement: string;
    difficulty: string;
  } | null>(null);

  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      // Use the JD assessment endpoint with a crafted prompt to produce a
      // single problem, then surface the first question to the interviewer.
      const res = await api.post<{
        questions: Array<{
          title: string;
          difficulty: string;
          statement: string;
          starterCode: string;
          publicTests: unknown[];
          hiddenTests: unknown[];
        }>;
      }>("/ai/assessment", {
        jd: `Generate ONE DSA coding problem: ${prompt}`,
      });
      const q = res.questions[0];
      if (q) {
        setGenerated({
          title: q.title,
          statement: q.statement,
          difficulty: q.difficulty,
        });
      } else {
        toast.error("No question was generated.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!generated) return;
    setLoading(true);
    try {
      await api.post("/questions", {
        slug:
          generated.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") +
          "-" +
          Math.random().toString(36).slice(2, 6),
        title: generated.title,
        difficulty: generated.difficulty,
        tags: ["AI-Generated"],
        statement: generated.statement,
        starterCode: { javascript: generated.statement },
        publicTests: [],
        hiddenTests: [],
      });
      toast.success("Question saved to the bank.");
      setGenerated(null);
      setPrompt("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-white/10 bg-[oklch(0.19_0.02_264)] text-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            AI Question Generator
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Describe a problem and the AI will draft a complete DSA question you
            can save to the bank.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="p">Problem description</Label>
            <Textarea
              id="p"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A problem that tests graph traversal to find the shortest path in a weighted grid…"
              rows={3}
              className="border-white/10 bg-white/5 text-slate-100"
            />
          </div>
          {generated && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className={difficultyColor(generated.difficulty)}>
                  {generated.difficulty}
                </Badge>
                <span className="text-sm font-medium text-white">
                  {generated.title}
                </span>
              </div>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-xs text-slate-300 scrollbar-thin">
                {generated.statement}
              </pre>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-slate-300"
          >
            Cancel
          </Button>
          {generated ? (
            <Button
              onClick={save}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Save to bank
            </Button>
          ) : (
            <Button
              onClick={generate}
              disabled={loading || !prompt.trim()}
              className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
