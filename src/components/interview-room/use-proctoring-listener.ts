"use client";

import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket-client";
import { api } from "@/lib/api";
import type { ProctoringLog } from "@/lib/client-types";

interface UseProctoringListenerArgs {
  roomCode: string | null | undefined;
  userId: string | null | undefined;
  interviewId: string | null | undefined;
  // When false the hook attaches no listeners (e.g. interviewers don't get
  // proctored). Defaults to true.
  enabled?: boolean;
}

type ProctoringType =
  | "tab-switch"
  | "window-blur"
  | "paste-anomaly"
  | "fullscreen-exit";

/**
 * Attaches browser-level proctoring listeners for the candidate. Detects tab
 * switches (visibilitychange), window blur, large paste events, and fullscreen
 * exits, then emits a `proctoring:violation` event on the collab socket AND
 * persists the log via `PATCH /interviews/[id]` so interviewers see it in real
 * time and in the post-session evidence report.
 *
 * Each violation type is debounced to a maximum of one event per 3 seconds so
 * the feed never gets spammed (e.g. alt-tabbing in rapid succession).
 */
export function useProctoringListener({
  roomCode,
  userId,
  interviewId,
  enabled = true,
}: UseProctoringListenerArgs) {
  // Last emission timestamp per violation type, for the 3-second debounce.
  const lastEmittedRef = useRef<Record<ProctoringType, number>>({
    "tab-switch": 0,
    "window-blur": 0,
    "paste-anomaly": 0,
    "fullscreen-exit": 0,
  });
  // The latest roomCode/interviewId, kept in a ref so the listeners (attached
  // only once) always read the current values. Updated inside an effect so we
  // never mutate a ref during render.
  const ctxRef = useRef({ roomCode, userId, interviewId });
  useEffect(() => {
    ctxRef.current = { roomCode, userId, interviewId };
  }, [roomCode, userId, interviewId]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const DEBOUNCE_MS = 3000;

    function emit(
      type: ProctoringType,
      detail: string,
      severity: "low" | "medium" | "high"
    ) {
      const { roomCode: rc, userId: uid, interviewId: ivId } = ctxRef.current;
      if (!rc || !uid || !ivId) return;
      const now = Date.now();
      if (now - lastEmittedRef.current[type] < DEBOUNCE_MS) return;
      lastEmittedRef.current[type] = now;

      const log: ProctoringLog = { type, detail, severity, timestamp: now };
      try {
        const socket = getSocket();
        socket.emit("proctoring:violation", {
          roomCode: rc,
          type,
          detail,
          severity,
          timestamp: now,
        });
      } catch {
        /* socket not connected yet — fall through to the persistent PATCH */
      }
      // Persist to the interview session so the interviewer's feed and the
      // post-session evidence report include it.
      api
        .patch(`/interviews/${ivId}`, { appendProctoring: log })
        .catch(() => {
          /* swallow — proctoring persistence is best-effort */
        });
    }

    function onVisibility() {
      if (document.hidden) {
        emit("tab-switch", "Tab switched away", "high");
      }
    }

    function onBlur() {
      emit("window-blur", "Window lost focus", "medium");
    }

    function onPaste(e: ClipboardEvent) {
      const text = e.clipboardData?.getData("text") ?? "";
      if (text.length > 200) {
        emit("paste-anomaly", `Pasted ${text.length} chars`, "medium");
      }
    }

    function onFullscreen() {
      if (!document.fullscreenElement) {
        emit("fullscreen-exit", "Exited fullscreen", "low");
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("paste", onPaste, true);
    document.addEventListener("fullscreenchange", onFullscreen);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("paste", onPaste, true);
      document.removeEventListener("fullscreenchange", onFullscreen);
    };
  }, [enabled]);
}
