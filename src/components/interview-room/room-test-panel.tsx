"use client";

import { useCallback, useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  statusColor,
  formatDurationMs,
  formatMemoryKb,
} from "@/lib/format";
import type {
  QuestionListItem,
  RunResult,
} from "@/lib/client-types";
import type { TestResult } from "@/lib/types";

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

interface RoomTestPanelProps {
  question: QuestionListItem;
  /** Pulls the current code/language from the collaborative editor. */
  getCode: () => { code: string; language: string };
  /** Persist + broadcast a code snapshot (called on Run/Submit). */
  onSnapshot?: (
    eventType: "run" | "submit",
    code: string,
    language: string
  ) => void;
  /** When true, hide hidden-test indicators (candidate view). */
  hideHiddenTests?: boolean;
}

/**
 * Run/Submit panel for the interview room. Mirrors PracticePanel's result
 * rendering but pulls live code from the CollaborativeEditor and records a
 * snapshot on each Run/Submit so the replay timeline stays accurate.
 */
export function RoomTestPanel({
  question,
  getCode,
  onSnapshot,
  hideHiddenTests = true,
}: RoomTestPanelProps) {
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [activeTab, setActiveTab] = useState<"tests" | "stdout" | "stderr">(
    "tests"
  );
  const [expanded, setExpanded] = useState<number | null>(0);

  const handleRun = useCallback(async () => {
    const { code, language } = getCode();
    if (!code || !code.trim()) {
      toast.error("No code to run.");
      return;
    }
    setRunning(true);
    setActiveTab("tests");
    onSnapshot?.("run", code, language);
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
  }, [question.id, getCode, onSnapshot]);

  const handleSubmit = useCallback(async () => {
    const { code, language } = getCode();
    if (!code || !code.trim()) {
      toast.error("No code to submit.");
      return;
    }
    setSubmitting(true);
    setActiveTab("tests");
    onSnapshot?.("submit", code, language);
    try {
      const res = await api.post<SubmitResponse>("/submissions/submit", {
        questionId: question.id,
        code,
        language,
        snapshots: [],
      });
      setResult(res);
      setRunResult(null);
      setExpanded(0);
      if (res.status === "ACCEPTED") {
        toast.success(
          `Accepted — ${res.passedCount}/${res.totalCount} tests passed!`
        );
      } else {
        toast.error(
          `${res.statusLabel} — ${res.passedCount}/${res.totalCount} passed`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }, [question.id, getCode, onSnapshot]);

  const displayResults = result?.results || runResult?.results || [];
  const passedCount = result?.passedCount ?? runResult?.passedCount ?? 0;
  const totalCount = result?.totalCount ?? runResult?.totalCount ?? 0;
  const execMs = result?.executionTimeMs ?? runResult?.executionTimeMs ?? 0;
  const memKb = result?.memoryKb ?? runResult?.memoryKb ?? 0;
  const overall = result?.statusLabel || runResult?.overallStatus || "";
  const stdout = result?.stdout || runResult?.stdout || "";
  const stderr = result?.stderr || runResult?.stderr || "";

  return (
    <div className="flex max-h-[40vh] flex-col border-t border-white/10 bg-[oklch(0.17_0.02_264)]">
      {/* Action bar */}
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
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

      {/* Results tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        className="w-full flex-1"
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
        <TabsContent
          value="tests"
          className="m-0 max-h-72 overflow-y-auto scrollbar-thin"
        >
          {displayResults.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-xs text-slate-400">
              <Terminal className="h-5 w-5 opacity-50" />
              Run or submit to see per-case results.
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {displayResults.map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => setExpanded(expanded === i ? null : i)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/5"
                  >
                    {r.passed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    )}
                    <span className="text-slate-200">
                      Case {i + 1}
                      {r.isHidden && !hideHiddenTests && (
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
                      <ChevronDown className="h-3 w-3 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-slate-500" />
                    )}
                  </button>
                  {expanded === i && (
                    <div className="grid gap-2 bg-black/20 px-3 py-2 text-xs sm:grid-cols-2">
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
        <TabsContent value="stdout" className="m-0 max-h-72">
          <ScrollArea className="h-72">
            <pre className="whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs text-slate-300">
              {stdout || "No stdout captured."}
            </pre>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="stderr" className="m-0 max-h-72">
          <ScrollArea className="h-72">
            <pre className="whitespace-pre-wrap break-words px-3 py-2 font-mono text-xs text-rose-300">
              {stderr || "No errors."}
            </pre>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-between border-t border-white/10 px-3 py-1 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {question.timeLimitMs}ms · {question.memoryLimitMb}MB limits
        </span>
        <span className="font-mono">{question.slug}</span>
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
