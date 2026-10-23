"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type * as Monaco from "monaco-editor";
import { RefreshCw, Terminal, Users as UsersIcon } from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import { LANGUAGES, MONACO_THEME, CURSOR_COLORS } from "@/lib/client-constants";
import { difficultyColor } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import type {
  PublicUser,
  QuestionListItem,
  PresenceUser,
} from "@/lib/client-types";

// Monaco editor manipulates the DOM heavily and references `window`, so it must
// be loaded client-side only via next/dynamic.
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((m) => m.default),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

interface CollaborativeEditorProps {
  question: QuestionListItem;
  roomCode: string;
  user: PublicUser;
  /** Initial code (e.g. last snapshot) — falls back to starterCode[language]. */
  initialCode?: string;
  /** Initial language id — falls back to first non-empty starter. */
  initialLanguage?: string;
  /** Live callback fired (debounced) on local code/language change. */
  onCodeChange?: (code: string, language: string) => void;
  /** Lets the parent pull the current code/language on demand (e.g. for Run). */
  onEditorReady?: (getter: () => { code: string; language: string }) => void;
  /** Live presence list — used to render the "who's editing" legend. */
  presence?: PresenceUser[];
}

interface RemoteCursorState {
  userId: string;
  userName: string;
  color: string;
  line: number;
  column: number;
}

/** Pick a stable color for a given user id. */
function colorFor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

function pickInitialLanguage(question: QuestionListItem): string {
  const sc = question.starterCode as unknown as
    | Record<string, string>
    | undefined;
  if (sc) {
    for (const l of LANGUAGES) {
      if (sc[l.id] && sc[l.id].trim()) return l.id;
    }
  }
  return "javascript";
}

/** Typed accessor for a single language's starter code. */
function starterFor(question: QuestionListItem, lang: string): string {
  const sc = question.starterCode as unknown as
    | Record<string, string>
    | undefined;
  return (sc && sc[lang]) || "// Write your solution here";
}

export function CollaborativeEditor({
  question,
  roomCode,
  user,
  initialCode,
  initialLanguage,
  onCodeChange,
  onEditorReady,
  presence = [],
}: CollaborativeEditorProps) {
  const [language, setLanguage] = useState<string>(
    initialLanguage || pickInitialLanguage(question)
  );
  const [code, setCode] = useState<string>(
    initialCode ?? starterFor(question, language)
  );
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, RemoteCursorState>
  >({});

  // Editor instance refs (kept off React state to avoid re-renders).
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);
  // Map userId → content widget instance, so we can update or remove them.
  const widgetsRef = useRef<
    Map<string, Monaco.editor.IContentWidget>
  >(new Map());

  // Guards + debounce timers.
  const isApplyingRemoteRef = useRef(false);
  const emitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest code/language in a ref so timers + onEditorReady read fresh values.
  const stateRef = useRef({ code, language });
  useEffect(() => {
    stateRef.current = { code, language };
  }, [code, language]);

  // Reset state when the question changes. We use the React "adjust state
  // when a prop changes" pattern (synchronous during render) instead of an
  // effect to avoid cascading renders.
  const [prevQuestionId, setPrevQuestionId] = useState(question.id);
  if (question.id !== prevQuestionId) {
    setPrevQuestionId(question.id);
    const lang = initialLanguage || pickInitialLanguage(question);
    setLanguage(lang);
    setCode(initialCode ?? starterFor(question, lang));
  }

  // Expose a getter to the parent so it can pull code/language for Run/Submit.
  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(() => ({ ...stateRef.current }));
    }
  }, [onEditorReady]);

  // ---------- Local changes → emit (debounced) ----------
  const scheduleEmit = useCallback(() => {
    if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
    emitTimerRef.current = setTimeout(() => {
      const { code: c, language: l } = stateRef.current;
      try {
        const socket = getSocket();
        socket.emit("code:change", { roomCode, code: c, language: l });
      } catch {
        /* socket not connected yet */
      }
      onCodeChange?.(c, l);
    }, 150);
  }, [roomCode, onCodeChange]);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (isApplyingRemoteRef.current) return;
      setCode(value ?? "");
      scheduleEmit();
    },
    [scheduleEmit]
  );

  function handleLanguageChange(lang: string) {
    if (isApplyingRemoteRef.current) return;
    setLanguage(lang);
    const nextCode = starterFor(question, lang);
    setCode(nextCode);
    try {
      const socket = getSocket();
      socket.emit("language:change", { roomCode, language: lang });
    } catch {
      /* ignore */
    }
    onCodeChange?.(nextCode, lang);
  }

  // ---------- Cursor: emit on position change (debounced) ----------
  const handleCursorPositionChange = useCallback(
    (e: Monaco.editor.ICursorPositionChangedEvent) => {
      if (isApplyingRemoteRef.current) return;
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
      cursorTimerRef.current = setTimeout(() => {
        try {
          const socket = getSocket();
          socket.emit("cursor:move", {
            roomCode,
            line: e.position.lineNumber,
            column: e.position.column,
            userId: user.id,
            userName: user.name,
            color: colorFor(user.id),
          });
        } catch {
          /* ignore */
        }
      }, 80);
    },
    [roomCode, user.id, user.name]
  );

  // ---------- Apply remote cursor decorations ----------
  const applyRemoteCursors = useCallback(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    type WidgetWithHolder = Monaco.editor.IContentWidget & {
      _holder: { line: number; column: number };
    };

    // Update / add a content widget for each remote cursor.
    const seen = new Set<string>();
    for (const [userId, c] of Object.entries(remoteCursors)) {
      seen.add(userId);
      const existing = widgetsRef.current.get(userId) as
        | WidgetWithHolder
        | undefined;
      if (!existing) {
        const node = document.createElement("div");
        node.className = "remote-cursor-badge";
        node.style.color = "#0b1020";
        node.style.padding = "1px 6px";
        node.style.borderRadius = "6px 6px 6px 0";
        node.style.fontSize = "10px";
        node.style.fontWeight = "600";
        node.style.lineHeight = "14px";
        node.style.whiteSpace = "nowrap";
        node.style.boxShadow = "0 1px 6px rgba(0,0,0,0.35)";
        node.style.transform = "translateY(-100%)";
        node.style.pointerEvents = "none";
        node.textContent = c.userName;
        node.style.background = c.color;
        // Mutable holder so getPosition reads the latest line/column.
        const holder = { line: c.line, column: c.column };
        const widget: WidgetWithHolder = {
          getId: () => `remote-cursor-${userId}`,
          getDomNode: () => node,
          getPosition: () => ({
            position: {
              lineNumber: Math.max(1, holder.line),
              column: Math.max(1, holder.column),
            },
            preference: [
              monaco.editor.ContentWidgetPositionPreference.ABOVE,
              monaco.editor.ContentWidgetPositionPreference.BELOW,
            ],
          }),
          _holder: holder,
        };
        editor.addContentWidget(widget);
        widgetsRef.current.set(userId, widget);
      } else {
        existing._holder.line = c.line;
        existing._holder.column = c.column;
        const node = existing.getDomNode();
        node.textContent = c.userName;
        node.style.background = c.color;
        editor.layoutContentWidget(existing);
      }
    }
    // Remove widgets for users that are no longer sending cursors.
    for (const [userId, widget] of widgetsRef.current.entries()) {
      if (!seen.has(userId)) {
        editor.removeContentWidget(widget);
        widgetsRef.current.delete(userId);
      }
    }

    // Line highlight decorations for each remote cursor.
    const newDecorations: Monaco.editor.IModelDeltaDecoration[] = Object.values(
      remoteCursors
    ).map((c) => ({
      range: new monaco.Range(c.line, c.column, c.line, c.column + 1),
      options: {
        className: "remote-cursor-line",
        beforeContentClassName: "remote-cursor-marker",
        stickiness:
          monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
      },
    }));
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [remoteCursors]);

  useEffect(() => {
    applyRemoteCursors();
  }, [remoteCursors, applyRemoteCursors]);

  // Clean up widgets on unmount.
  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      if (editor) {
        for (const widget of widgetsRef.current.values()) {
          try {
            editor.removeContentWidget(widget);
          } catch {
            /* ignore */
          }
        }
        widgetsRef.current.clear();
      }
      if (emitTimerRef.current) clearTimeout(emitTimerRef.current);
      if (cursorTimerRef.current) clearTimeout(cursorTimerRef.current);
    };
  }, []);

  // ---------- Socket listeners ----------
  useEffect(() => {
    const socket = getSocket();
    function onCodeChange(payload: { code?: string; language?: string }) {
      if (!payload || typeof payload.code !== "string") return;
      isApplyingRemoteRef.current = true;
      setCode(payload.code);
      if (payload.language && payload.language !== stateRef.current.language) {
        setLanguage(payload.language);
      }
      // Reset the guard on the next tick so the local onChange doesn't get
      // blocked by our own update.
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    }
    function onLanguageChange(payload: { language?: string }) {
      if (!payload || !payload.language) return;
      const lang = payload.language;
      if (lang === stateRef.current.language) return;
      isApplyingRemoteRef.current = true;
      setLanguage(lang);
      setCode(starterFor(question, lang));
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 0);
    }
    function onCursorMove(payload: {
      userId: string;
      userName: string;
      color?: string;
      line: number;
      column: number;
    }) {
      if (!payload || !payload.userId) return;
      if (payload.userId === user.id) return; // ignore our own cursor echoed back
      setRemoteCursors((prev) => ({
        ...prev,
        [payload.userId]: {
          userId: payload.userId,
          userName: payload.userName || "User",
          color: payload.color || colorFor(payload.userId),
          line: payload.line,
          column: payload.column,
        },
      }));
    }
    socket.on("code:change", onCodeChange);
    socket.on("language:change", onLanguageChange);
    socket.on("cursor:move", onCursorMove);
    return () => {
      socket.off("code:change", onCodeChange);
      socket.off("language:change", onLanguageChange);
      socket.off("cursor:move", onCursorMove);
    };
  }, [question.starterCode, user.id]);

  function handleEditorMount(
    editor: Monaco.editor.IStandaloneCodeEditor,
    monaco: typeof Monaco
  ) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    // Attach the cursor-position listener directly on the editor instance —
    // @monaco-editor/react's <Editor /> has no onCursorPositionChange prop.
    editor.onDidChangeCursorPosition(handleCursorPositionChange);
    // Define the CSS classes used by remote-cursor decorations once.
    try {
      const styleId = "remote-cursor-styles";
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `
          .remote-cursor-line {
            background: rgba(99,102,241,0.18);
            border-left: 2px solid rgba(99,102,241,0.85);
          }
          .remote-cursor-marker {
            display: inline-block;
            width: 2px;
            height: 100%;
            background: rgba(99,102,241,0.85);
            vertical-align: text-bottom;
          }
          .remote-cursor-badge {
            position: absolute;
            z-index: 10;
          }
        `;
        document.head.appendChild(style);
      }
    } catch {
      /* ignore */
    }
  }

  // Build the "who's editing" legend from presence (excluding self).
  const others = presence.filter((p) => p.userId !== user.id);
  const fileExt = language === "javascript" ? "js" : language === "python" ? "py" : language === "java" ? "java" : "cpp";

  return (
    <div className="flex h-full flex-col">
      {/* Header: question title + difficulty + language + presence */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[oklch(0.18_0.02_264)] px-4 py-2">
        <h2 className="truncate text-sm font-semibold text-white">
          {question.title}
        </h2>
        <Badge variant="outline" className={difficultyColor(question.difficulty)}>
          {question.difficulty}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          {others.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <UsersIcon className="h-3.5 w-3.5" />
              <div className="flex -space-x-1.5">
                {others.slice(0, 4).map((p) => (
                  <span
                    key={p.userId}
                    title={p.userName}
                    className="inline-block h-5 w-5 rounded-full border border-white/20 text-[9px] font-bold leading-5 text-white"
                    style={{ background: colorFor(p.userId) }}
                  >
                    {p.userName.charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200"
            aria-label="Code language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Editor chrome header */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[oklch(0.15_0.02_264)] px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Terminal className="h-3.5 w-3.5" />
          <span className="font-mono">
            {question.slug}.{fileExt}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-slate-500">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: colorFor(user.id) }}
            />
            you
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <MonacoEditor
          height="100%"
          language={language}
          theme={MONACO_THEME}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontFamily: "var(--font-geist-mono), monospace",
            tabSize: 2,
            automaticLayout: true,
            padding: { top: 8 },
            glyphMargin: true,
            renderLineHighlight: "all",
          }}
        />
      </div>

      {/* Inline styles for the remote cursor badge (the floating name pill)
       * are injected in handleEditorMount via a <style> tag. */}
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
