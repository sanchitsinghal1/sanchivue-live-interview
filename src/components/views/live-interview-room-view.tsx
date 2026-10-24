"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ResizablePanelGroup as PanelGroup,
  ResizablePanel as Panel,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Hash,
  Loader2,
  LogOut,
  MonitorPlay,
  PenLine,
  ShieldAlert,
  Sparkles,
  SquarePen,
  Timer,
  Users as UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { getSocket } from "@/lib/socket-client";
import { AppNavbar } from "@/components/common/app-navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { isInterviewerRole } from "@/lib/client-constants";
import type {
  ChatMessage,
  CodeSnapshot,
  PresenceUser,
  PublicUser,
  QuestionListItem,
  RubricScores,
  ProctoringLog,
} from "@/lib/client-types";
import { CollaborativeEditor } from "@/components/interview-room/collaborative-editor";
import { WhiteboardCanvas } from "@/components/interview-room/whiteboard-canvas";
import { RoomChatBox } from "@/components/interview-room/room-chat-box";
import { RoomTestPanel } from "@/components/interview-room/room-test-panel";
import { AiCopilotDrawer } from "@/components/interview-room/ai-copilot-drawer";
import { ProctoringAlertFeed } from "@/components/interview-room/proctoring-feed";
import { RubricScorecard } from "@/components/interview-room/rubric-scorecard";
import { VideoCallGrid } from "@/components/interview-room/video-call-grid";
import { useProctoringListener } from "@/components/interview-room/use-proctoring-listener";

// Shape returned by GET /interviews/[id].
interface InterviewDetail {
  id: string;
  roomCode: string;
  status: string;
  interviewer: { id: string; name: string; email: string };
  candidate: { id: string; name: string; email: string } | null;
  question: QuestionListItem | null;
  chatLog: ChatMessage[];
  proctoringLogs: ProctoringLog[];
  snapshots: CodeSnapshot[];
  rubricDraft: RubricScores;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
}

export function LiveInterviewRoomView() {
  const { user, activeInterviewId, setView } = useAppStore();
  const [interview, setInterview] = useState<InterviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "whiteboard">(
    "editor"
  );
  const [rightTab, setRightTab] = useState<"chat" | "proctoring" | "rubric">(
    "chat"
  );
  const [copied, setCopied] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [ending, setEnding] = useState(false);

  // Refs we re-use inside socket listeners and timers.
  const editorGetterRef = useRef<
    (() => { code: string; language: string }) | null
  >(null);
  const snapshotsRef = useRef<CodeSnapshot[]>([]);

  const isInterviewer = user ? isInterviewerRole(user.role) : false;

  // ---------- Load interview + auto-start if SCHEDULED ----------
  useEffect(() => {
    let active = true;
    async function load() {
      if (!activeInterviewId) {
        setError("No interview selected.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<InterviewDetail>(
          `/interviews/${activeInterviewId}`
        );
        if (!active) return;
        setInterview(data);
        snapshotsRef.current = (data.snapshots || []).slice(-50);
        // If SCHEDULED and the current user is the interviewer or the
        // assigned candidate, transition to LIVE so the timer starts.
        if (
          data.status === "SCHEDULED" &&
          user &&
          (data.interviewer.id === user.id ||
            data.candidate?.id === user.id)
        ) {
          try {
            await api.patch(`/interviews/${activeInterviewId}`, {
              status: "LIVE",
            });
            // Optimistically update local state.
            setInterview((prev) =>
              prev
                ? {
                    ...prev,
                    status: "LIVE",
                    startedAt: prev.startedAt || new Date().toISOString(),
                  }
                : prev
            );
          } catch {
            /* the GET still succeeded; we just couldn't transition */
          }
        }
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Failed to load interview.";
        setError(msg);
        toast.error(msg);
        // Bounce back to the dashboard on auth/not-found errors.
        setTimeout(() => setView("dashboard"), 800);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [activeInterviewId, user?.id]);

  // ---------- Socket: join + presence ----------
  useEffect(() => {
    if (!interview || !user) return;
    const socket = getSocket();
    function onPresence(users: PresenceUser[]) {
      if (Array.isArray(users)) setPresence(users);
    }
    socket.on("presence:update", onPresence);

    // Emit join-room (idempotent — the server dedupes by userId).
    const join = () => {
      socket.emit("join-room", {
        roomCode: interview.roomCode,
        userId: user.id,
        userName: user.name,
        role: user.role,
      });
    };
    if (socket.connected) join();
    socket.on("connect", join);

    return () => {
      socket.off("presence:update", onPresence);
      socket.off("connect", join);
    };
  }, [interview?.roomCode, user?.id]);

  // ---------- Live elapsed timer ----------
  useEffect(() => {
    if (!interview?.startedAt) {
      setElapsedSec(0);
      return;
    }
    const start = new Date(interview.startedAt).getTime();
    function tick() {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [interview?.startedAt]);

  // ---------- Auto-snapshot every 15s ----------
  useEffect(() => {
    if (!interview || !user) return;
    const id = setInterval(() => {
      const getter = editorGetterRef.current;
      if (!getter) return;
      const { code, language } = getter();
      if (!code) return;
      const snap: CodeSnapshot = {
        timestamp: Date.now(),
        code,
        language,
        eventType: "auto",
      };
      snapshotsRef.current = [...snapshotsRef.current, snap].slice(-50);
      try {
        const socket = getSocket();
        socket.emit("snapshot:save", {
          roomCode: interview.roomCode,
          code,
          language,
          eventType: "auto",
          timestamp: snap.timestamp,
        });
      } catch {
        /* ignore */
      }
      api
        .patch(`/interviews/${interview.id}`, { appendSnapshot: snap })
        .catch(() => {
          /* best-effort */
        });
    }, 15000);
    return () => clearInterval(id);
  }, [interview?.id, interview?.roomCode, user]);

  // ---------- Candidate proctoring listener ----------
  useProctoringListener({
    roomCode: interview?.roomCode,
    userId: user?.id,
    interviewId: interview?.id,
    enabled: !!interview && !!user && !isInterviewer,
  });

  // ---------- Helpers ----------
  const handleEditorReady = useCallback(
    (getter: () => { code: string; language: string }) => {
      editorGetterRef.current = getter;
    },
    []
  );

  const getCodeForPanel = useCallback(() => {
    return (
      editorGetterRef.current?.() ?? { code: "", language: "javascript" }
    );
  }, []);

  const getCodeForCopilot = useCallback(() => {
    const { code, language } = getCodeForPanel();
    return {
      code,
      questionStatement: interview?.question?.statement || "",
      language,
    };
  }, [getCodeForPanel, interview?.question?.statement]);

  const recordSnapshot = useCallback(
    (eventType: "run" | "submit", code: string, language: string) => {
      if (!interview) return;
      const snap: CodeSnapshot = {
        timestamp: Date.now(),
        code,
        language,
        eventType,
      };
      snapshotsRef.current = [...snapshotsRef.current, snap].slice(-50);
      try {
        const socket = getSocket();
        socket.emit("snapshot:save", {
          roomCode: interview.roomCode,
          code,
          language,
          eventType,
          timestamp: snap.timestamp,
        });
      } catch {
        /* ignore */
      }
      api
        .patch(`/interviews/${interview.id}`, { appendSnapshot: snap })
        .catch(() => {
          /* ignore */
        });
    },
    [interview]
  );

  function copyRoomCode() {
    if (!interview) return;
    try {
      navigator.clipboard.writeText(interview.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Room code copied.");
    } catch {
      toast.error("Could not copy room code.");
    }
  }

  async function endSession() {
    if (!interview) return;
    setEnding(true);
    try {
      await api.patch(`/interviews/${interview.id}`, { status: "ENDED" });
      toast.success("Session ended. Redirecting to evaluation…");
      // Keep activeInterviewId so the EvaluationReportView picks it up.
      setView("evaluation");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not end session.");
    } finally {
      setEnding(false);
    }
  }

  // ---------- Render ----------
  if (!user) {
    // Shouldn't happen — the app shell guards auth — but be safe.
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.16_0.02_264)] text-slate-300">
        <Button onClick={() => setView("landing")}>Back home</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[oklch(0.16_0.02_264)] text-slate-200">
        <AppNavbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            <p className="text-sm">Loading interview room…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activeInterviewId || (!interview && error)) {
    return (
      <div className="flex min-h-screen flex-col bg-[oklch(0.16_0.02_264)] text-slate-200">
        <AppNavbar />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="rounded-xl bg-white/5 p-4">
            <CalendarClock className="h-8 w-8 text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-white">
              {error || "No interview selected"}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Pick an interview from your dashboard to enter the live room.
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
      </div>
    );
  }

  if (!interview) return null;

  const live = interview.status === "LIVE";
  const elapsedLabel = formatElapsed(elapsedSec);

  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.16_0.02_264)] text-slate-200">
      <AppNavbar />
      {/* Full-viewport workspace minus the 3.5rem navbar. */}
      <div className="h-[calc(100vh-3.5rem)]">
        <PanelGroup direction="horizontal" autoSaveId="lit-room-h">
          {/* Left/main panel: editor + whiteboard + test panel */}
          <Panel defaultSize={68} minSize={45}>
            <PanelGroup direction="vertical" autoSaveId="lit-room-v">
              {/* Top toolbar */}
              <Panel
                defaultSize={8}
                minSize={6}
                maxSize={14}
                className="!overflow-visible"
              >
                <RoomToolbar
                  roomCode={interview.roomCode}
                  onCopy={copyRoomCode}
                  copied={copied}
                  presence={presence}
                  user={user}
                  live={live}
                  elapsed={elapsedLabel}
                  startedAt={interview.startedAt}
                  isInterviewer={isInterviewer}
                  onEndSession={endSession}
                  ending={ending}
                  onToggleCopilot={() => setCopilotOpen((v) => !v)}
                />
              </Panel>

              {/* Tabs: Code Editor | Whiteboard */}
              <Panel defaultSize={62} minSize={30}>
                <Tabs
                  value={activeTab}
                  onValueChange={(v) =>
                    setActiveTab(v as "editor" | "whiteboard")
                  }
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center gap-1 border-b border-white/10 bg-[oklch(0.18_0.02_264)] px-2 py-1">
                    <TabsList className="h-8 bg-transparent p-0.5">
                      <TabsTrigger
                        value="editor"
                        className="gap-1.5 rounded-md data-[state=active]:bg-white/10"
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Code Editor
                      </TabsTrigger>
                      <TabsTrigger
                        value="whiteboard"
                        className="gap-1.5 rounded-md data-[state=active]:bg-white/10"
                      >
                        <SquarePen className="h-3.5 w-3.5" />
                        Whiteboard
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="editor" className="m-0 min-h-0 flex-1">
                    {interview.question ? (
                      <CollaborativeEditor
                        question={interview.question}
                        roomCode={interview.roomCode}
                        user={user}
                        presence={presence}
                        onEditorReady={handleEditorReady}
                      />
                    ) : (
                      <NoQuestionState
                        onBack={() => setView("question-bank")}
                      />
                    )}
                  </TabsContent>
                  <TabsContent value="whiteboard" className="m-0 min-h-0 flex-1">
                    <WhiteboardCanvas roomCode={interview.roomCode} />
                  </TabsContent>
                </Tabs>
              </Panel>

              {/* Test panel (run/submit) */}
              {interview.question && (
                <Panel defaultSize={30} minSize={12} maxSize={60}>
                  <RoomTestPanel
                    question={interview.question}
                    getCode={getCodeForPanel}
                    onSnapshot={recordSnapshot}
                    hideHiddenTests={!isInterviewer}
                  />
                </Panel>
              )}
            </PanelGroup>
          </Panel>

          <PanelResizeHandle className="w-px bg-white/10 hover:bg-white/20" />

          {/* Right sidebar: video + chat + (interviewer) proctoring + rubric */}
          <Panel defaultSize={32} minSize={22} maxSize={45}>
            <PanelGroup direction="vertical" autoSaveId="lit-room-side">
              <Panel defaultSize={32} minSize={15} maxSize={55}>
                <VideoCallGrid
                  user={user}
                  presence={presence}
                  fallbackParticipants={[
                    {
                      id: interview.interviewer.id,
                      name: interview.interviewer.name,
                      role: "interviewer",
                    },
                    ...(interview.candidate
                      ? [
                          {
                            id: interview.candidate.id,
                            name: interview.candidate.name,
                            role: "candidate",
                          },
                        ]
                      : []),
                  ]}
                  className="h-full bg-[oklch(0.18_0.02_264)]"
                />
              </Panel>

              <PanelResizeHandle className="h-px bg-white/10 hover:bg-white/20" />

              <Panel defaultSize={68} minSize={30}>
                <Tabs
                  value={rightTab}
                  onValueChange={(v) =>
                    setRightTab(v as "chat" | "proctoring" | "rubric")
                  }
                  className="flex h-full flex-col bg-[oklch(0.18_0.02_264)]"
                >
                  <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1">
                    <TabsList className="h-8 bg-transparent p-0.5">
                      <TabsTrigger
                        value="chat"
                        className="gap-1.5 rounded-md data-[state=active]:bg-white/10"
                      >
                        Chat
                      </TabsTrigger>
                      {isInterviewer && (
                        <TabsTrigger
                          value="proctoring"
                          className="gap-1.5 rounded-md data-[state=active]:bg-white/10"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Proctoring
                        </TabsTrigger>
                      )}
                      {isInterviewer && (
                        <TabsTrigger
                          value="rubric"
                          className="gap-1.5 rounded-md data-[state=active]:bg-white/10"
                        >
                          Rubric
                        </TabsTrigger>
                      )}
                    </TabsList>
                  </div>
                  <TabsContent value="chat" className="m-0 min-h-0 flex-1">
                    <RoomChatBox
                      roomCode={interview.roomCode}
                      interviewId={interview.id}
                      user={user}
                      initialMessages={interview.chatLog}
                      className="h-full bg-[oklch(0.18_0.02_264)]"
                    />
                  </TabsContent>
                  {isInterviewer && (
                    <TabsContent
                      value="proctoring"
                      className="m-0 min-h-0 flex-1"
                    >
                      <ProctoringAlertFeed
                        initialLogs={interview.proctoringLogs}
                        className="h-full"
                      />
                    </TabsContent>
                  )}
                  {isInterviewer && (
                    <TabsContent
                      value="rubric"
                      className="m-0 min-h-0 flex-1 overflow-y-auto scrollbar-thin"
                    >
                      <RubricScorecard
                        interviewId={interview.id}
                        initialDraft={interview.rubricDraft}
                        className="h-full"
                      />
                    </TabsContent>
                  )}
                </Tabs>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>

      {/* Interviewer-only AI Co-Pilot drawer */}
      {isInterviewer && (
        <AiCopilotDrawer
          open={copilotOpen}
          onOpenChange={setCopilotOpen}
          getCode={getCodeForCopilot}
        />
      )}

      {/* Session-ended guard: if the interview was already ENDED when we
       * loaded it, show a banner with a quick jump to the evaluation report. */}
      {interview.status === "ENDED" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-amber-500/40 bg-[oklch(0.19_0.02_264)] px-4 py-2 text-xs text-amber-200 shadow-lg">
            <Clock className="h-3.5 w-3.5" />
            This session has ended.
            <Button
              size="sm"
              variant="outline"
              onClick={() => setView("evaluation")}
              className="h-6 border-amber-500/40 bg-amber-500/10 px-2 text-amber-200 hover:bg-amber-500/20"
            >
              View report
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Sub-components (kept in the same file for cohesion) ----------------

function RoomToolbar({
  roomCode,
  onCopy,
  copied,
  presence,
  user,
  live,
  elapsed,
  startedAt,
  isInterviewer,
  onEndSession,
  ending,
  onToggleCopilot,
}: {
  roomCode: string;
  onCopy: () => void;
  copied: boolean;
  presence: PresenceUser[];
  user: PublicUser;
  live: boolean;
  elapsed: string;
  startedAt: string | null;
  isInterviewer: boolean;
  onEndSession: () => void;
  ending: boolean;
  onToggleCopilot: () => void;
}) {
  const others = presence.filter((p) => p.userId !== user.id);
  return (
    <div className="flex h-full flex-wrap items-center gap-3 border-b border-white/10 bg-[oklch(0.19_0.02_264)] px-4 py-2">
      {/* Room code */}
      <div className="flex items-center gap-2">
        <Hash className="h-3.5 w-3.5 text-slate-500" />
        <code className="rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-xs text-slate-200">
          {roomCode}
        </code>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onCopy}
              className="rounded-md border border-white/10 bg-white/5 p-1 text-slate-300 hover:bg-white/10"
              aria-label="Copy room code"
            >
              {copied ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>Copy room code</TooltipContent>
        </Tooltip>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Presence */}
      <div className="flex items-center gap-2">
        <UsersIcon className="h-3.5 w-3.5 text-slate-500" />
        <div className="flex -space-x-1.5">
          <PresenceAvatar
            name={user.name}
            color="#6366f1"
            title={`${user.name} (you)`}
          />
          {others.slice(0, 4).map((p) => (
            <PresenceAvatar
              key={p.userId}
              name={p.userName}
              color={colorFor(p.userId)}
              title={`${p.userName} (${p.role})`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400">
          {presence.length > 0
            ? `${presence.length} online`
            : "No one else here yet"}
        </span>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Live timer */}
      <div className="flex items-center gap-1.5 text-xs">
        {live ? (
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            LIVE
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400">
            <Timer className="h-3 w-3" />
            {startedAt ? "ENDED" : "READY"}
          </span>
        )}
        <span className="font-mono text-slate-200">{elapsed}</span>
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        {isInterviewer && (
          <Button
            size="sm"
            variant="outline"
            onClick={onToggleCopilot}
            className="border-white/15 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <Sparkles className="mr-1 h-3.5 w-3.5 text-emerald-400" />
            AI Co-Pilot
          </Button>
        )}
        {isInterviewer && (
          <Button
            size="sm"
            onClick={onEndSession}
            disabled={ending}
            className="bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:opacity-90"
          >
            {ending ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="mr-1 h-3.5 w-3.5" />
            )}
            End session
          </Button>
        )}
      </div>
    </div>
  );
}

function PresenceAvatar({
  name,
  color,
  title,
}: {
  name: string;
  color: string;
  title: string;
}) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          title={title}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 text-[9px] font-bold text-white"
          style={{ background: color }}
        >
          {initials}
        </span>
      </TooltipTrigger>
      <TooltipContent>{title}</TooltipContent>
    </Tooltip>
  );
}

function NoQuestionState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[oklch(0.15_0.02_264)] px-6 text-center">
      <div className="rounded-xl bg-white/5 p-4">
        <MonitorPlay className="h-7 w-7 text-indigo-400" />
      </div>
      <div>
        <p className="text-base font-medium text-white">No question assigned</p>
        <p className="mt-1 max-w-md text-sm text-slate-400">
          Pick a question from the question bank to start collaborating with
          code, run/submit, and AI analysis.
        </p>
      </div>
      <Button
        onClick={onBack}
        className="bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
      >
        Browse questions
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------- Utilities ----------------

function colorFor(userId: string): string {
  const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#06b6d4"];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return COLORS[hash % COLORS.length];
}

function formatElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
