"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Terminal,
  Clock,
  HardDrive,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  difficultyColor,
  statusColor,
  formatDurationMs,
  formatMemoryKb,
} from "@/lib/format";
import { LANGUAGES, MONACO_THEME } from "@/lib/client-constants";
import type {
  QuestionListItem,
  RunResult,
  TestCase,
  TestResult,
  CodeSnapshot,
} from "@/lib/client-types";
import { useAppStore } from "@/lib/store";

// Monaco editor is loaded client-side only (it manipulates the DOM heavily).
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface PracticePanelProps {
  question: QuestionListItem;
}

interface SubmitResponse {
  submissionId: string;
  status: string;
  passedCount: number;
  totalCount: number;
  results: TestResult[];
  executionTimeMs: number;
  memoryKb: number;
  stdout: string;
  stderr: string;
  statusLabel: string;
}

export function PracticePanel({ question }: PracticePanelProps) {
  const { user } = useAppStore();
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(
    question.starterCode.javascript || "// Write your solution here"
  );
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [activeTab, setActiveTab] = useState<"tests" | "stdout" | "stderr">(
    "tests"
  );
  const [expanded, setExpanded] = useState<number | null>(0);
  const snapshotsRef = useRef<CodeSnapshot[]>([]);

  // When the question changes, reset language + starter code.
  useEffect(() => {
    const lang = question.starterCode.javascript ? "javascript" : "python";
    setLanguage(lang);
    setCode(
      (question.starterCode as Record<string, string>)[lang] ||
        "// Write your solution here"
    );
    setResult(null);
    setRunResult(null);
    snapshotsRef.current = [];
  }, [question.id, question.starterCode]);

  // Capture periodic snapshots for the code replay feature.
  useEffect(() => {
    const timer = setInterval(() => {
      snapshotsRef.current.push({
        timestamp: Date.now(),
        code,
        language,
        eventType: "auto",
      });
      // Keep the last 50 auto-snapshots to avoid unbounded growth.
      if (snapshotsRef.current.length > 50) {
        snapshotsRef.current = snapshotsRef.current.slice(-50);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [code, language]);

  function onLanguageChange(lang: string) {
    setLanguage(lang);
    setCode(
      (question.starterCode as Record<string, string>)[lang] ||
        "// Write your solution here"
    );
  }

  const handleRun = useCallback(async () => {
    setRunning(true);
    setActiveTab("tests");
    try {
      const res = await api.post<RunResult>("/submissions/run", {
        questionId: question.id,
        code,
        language,
      });
      setRunResult(res);
      setResult(null);
      setExpanded(0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Run failed.");
    } finally {
      setRunning(false);
    }
  }, [question.id, code, language]);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setActiveTab("tests");
    try {
      const res = await api.post<SubmitResponse>("/submissions/submit", {
        questionId: question.id,
        code,
        language,
        snapshots: snapshotsRef.current,
      });
      setResult(res);
      setRunResult(null);
      setExpanded(0);
      if (res.status === "ACCEPTED") {
        toast.success(`Accepted — ${res.passedCount}/${res.totalCount} tests passed!`);
      } else {
        toast.error(`${res.statusLabel} — ${res.passedCount}/${res.totalCount} passed`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [question.id, code, language]);

  const displayResults = result?.results || runResult?.results || [];
  const passedCount = result?.passedCount ?? runResult?.passedCount ?? 0;
  const totalCount = result?.totalCount ?? runResult?.totalCount ?? 0;
  const execMs = result?.executionTimeMs ?? runResult?.executionTimeMs ?? 0;
  const memKb = result?.memoryKb ?? runResult?.memoryKb ?? 0;
  const overall = result?.statusLabel || runResult?.overallStatus || "";
  const stdout = result?.stdout || runResult?.stdout || "";
  const stderr = result?.stderr || runResult?.stderr || "";

  return (
    <div className="flex h-full flex-col">
      {/* Problem header */}
      <div className="border-b border-white/10 bg-[oklch(0.18_0.02_264)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-white">
            {question.title}
          </h2>
          <Badge
            variant="outline"
            className={difficultyColor(question.difficulty)}
          >
            {question.difficulty}
          </Badge>
          {question.tags.slice(0, 3).map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="border-white/10 bg-white/5 text-slate-300"
            >
              {t}
            </Badge>
          ))}
          <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {question.timeLimitMs}ms
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> {question.memoryLimitMb}MB
            </span>
          </div>
        </div>
      </div>

      {/* Statement */}
      <div className="max-h-44 overflow-y-auto border-b border-white/10 bg-[oklch(0.17_0.02_264)] px-4 py-3 scrollbar-thin">
        <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">
          {question.statement}
        </pre>
        {question.examples.length > 0 && (
          <div className="mt-3 space-y-2">
            {question.examples.slice(0, 2).map((ex, i) => (
              <div
                key={i}
                className="rounded-md border border-white/10 bg-black/20 p-2 text-xs"
              >
                <div className="text-slate-400">Input: {ex.input}</div>
                <div className="text-emerald-300">Output: {ex.output}</div>
                {ex.explanation && (
                  <div className="text-slate-400">
                    Explanation: {ex.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor + language */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[oklch(0.15_0.02_264)] px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-mono">{question.slug}.js</span>
        </div>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-[260px] flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          theme={MONACO_THEME}
          value={code}
          onChange={(v) => setCode(v || "")}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontFamily: "var(--font-geist-mono), monospace",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 8 },
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-white/10 bg-[oklch(0.18_0.02_264)] px-4 py-2">
        <Button
          size="sm"
          onClick={handleRun}
          disabled={running || submitting}
          variant="outline"
          className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
        >
          {running ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="mr-1 h-3.5 w-3.5" />
          )}
          Run
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={running || submitting}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
        >
          {submitting ? (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1 h-3.5 w-3.5" />
          )}
          Submit
        </Button>
        {overall && (
          <Badge
            variant="outline"
            className={
              result?.status === "ACCEPTED"
                ? statusColor("ACCEPTED")
                : statusColor(result?.status || "")
            }
          >
            {overall}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            {passedCount}/{totalCount}
          </span>
          <span className="flex items-center gap-1">
            <Cpu className="h-3 w-3" />
            {formatDurationMs(execMs)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="h-3 w-3" />
            {formatMemoryKb(memKb)}
          </span>
        </div>
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-hidden border-t border-white/10 bg-[oklch(0.17_0.02_264)]">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="h-9 w-full justify-start rounded-none border-b border-white/10 bg-transparent p-0">
            <TabsTrigger
              value="tests"
              className="rounded-none data-[state=active]:bg-white/5"
            >
              Test Cases ({displayResults.length})
            </TabsTrigger>
            <TabsTrigger
              value="stdout"
              className="rounded-none data-[state=active]:bg-white/5"
            >
              Stdout
            </TabsTrigger>
            <TabsTrigger
              value="stderr"
              className="rounded-none data-[state=active]:bg-white/5"
            >
              Stderr
            </TabsTrigger>
          </TabsList>
          <TabsContent value="tests" className="m-0 max-h-56 overflow-y-auto scrollbar-thin">
            {displayResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-sm text-slate-400">
                <Terminal className="h-6 w-6 opacity-50" />
                Run or submit your code to see per-case results.
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {displayResults.map((r, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setExpanded(expanded === i ? null : i)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs hover:bg-white/5"
                    >
                      {r.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span className="text-slate-200">
                        Case {i + 1}
                        {r.isHidden && (
                          <span className="ml-1 text-slate-500">(hidden)</span>
                        )}
                      </span>
                      <Badge
                        variant="outline"
                        className={statusColor(r.status)}
                      >
                        {r.status}
                      </Badge>
                      <span className="ml-auto text-slate-400">
                        {formatDurationMs(r.executionTimeMs)}
                      </span>
                      {expanded === i ? (
                        <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      )}
                    </button>
                    {expanded === i && (
                      <div className="grid gap-2 bg-black/20 px-4 py-2 text-xs sm:grid-cols-2">
                        <Detail label="Input" value={r.input} />
                        <Detail label="Expected" value={r.expected} />
                        <Detail label="Actual" value={r.actual} mono />
                        <Detail label="Stdout" value={r.stdout || "—"} mono />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="stdout" className="m-0 max-h-56">
            <ScrollArea className="h-56">
              <pre className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs text-slate-300">
                {stdout || "No stdout captured."}
              </pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="stderr" className="m-0 max-h-56">
            <ScrollArea className="h-56">
              <pre className="whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs text-rose-300">
                {stderr || "No errors."}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <div
        className={
          "mt-0.5 break-words text-slate-200 " + (mono ? "font-mono" : "")
        }
      >
        {value || "—"}
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
