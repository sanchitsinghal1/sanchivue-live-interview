"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  EyeOff,
  Eye,
  ClipboardList,
  Maximize,
  AlertTriangle,
} from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import { Badge } from "@/components/ui/badge";
import { severityColor, formatClockTime } from "@/lib/format";
import type { ProctoringLog } from "@/lib/client-types";

interface ProctoringAlertFeedProps {
  initialLogs?: ProctoringLog[];
  className?: string;
}

const TYPE_META: Record<
  ProctoringLog["type"],
  { icon: typeof EyeOff; label: string }
> = {
  "tab-switch": { icon: EyeOff, label: "Tab switch" },
  "window-blur": { icon: Eye, label: "Window blur" },
  "paste-anomaly": { icon: ClipboardList, label: "Paste anomaly" },
  "fullscreen-exit": { icon: Maximize, label: "Fullscreen exit" },
};

/**
 * Real-time anti-cheat proctoring feed shown to interviewers. Reads the
 * initial logs from the persisted interview session and appends live
 * `proctoring:violation` events emitted by the candidate over the socket.
 */
export function ProctoringAlertFeed({
  initialLogs = [],
  className,
}: ProctoringAlertFeedProps) {
  // Reset local state when the initial logs reference changes (e.g. when a
  // new interview is loaded). We track the previous "fingerprint" so we can
  // adjust during render rather than inside an effect.
  const initialKey = `${initialLogs.length}:${initialLogs[0]?.timestamp ?? 0}`;
  const [prevKey, setPrevKey] = useState(initialKey);
  const [logs, setLogs] = useState<ProctoringLog[]>(initialLogs);
  if (initialKey !== prevKey) {
    setPrevKey(initialKey);
    setLogs(initialLogs);
  }

  // Subscribe to live violation events.
  useEffect(() => {
    const socket = getSocket();
    function onViolation(log: ProctoringLog) {
      if (!log || typeof log.type !== "string") return;
      setLogs((prev) => {
        // De-dupe the exact same event echoed back.
        if (
          prev.length > 0 &&
          prev[0].timestamp === log.timestamp &&
          prev[0].type === log.type
        ) {
          return prev;
        }
        return [log, ...prev].slice(0, 200);
      });
    }
    socket.on("proctoring:violation", onViolation);
    return () => {
      socket.off("proctoring:violation", onViolation);
    };
  }, []);

  const counts = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    for (const l of logs) {
      if (l.severity === "high") c.high++;
      else if (l.severity === "medium") c.medium++;
      else c.low++;
    }
    return c;
  }, [logs]);

  return (
    <div className={"flex flex-col " + (className || "")}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          Proctoring
        </div>
        <div className="flex items-center gap-1">
          {counts.high > 0 && (
            <Badge
              variant="outline"
              className="border-rose-500/40 bg-rose-500/10 text-rose-300"
            >
              {counts.high} high
            </Badge>
          )}
          {counts.medium > 0 && (
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-300"
            >
              {counts.medium} med
            </Badge>
          )}
          {counts.low > 0 && (
            <Badge
              variant="outline"
              className="border-slate-500/30 bg-slate-500/10 text-slate-300"
            >
              {counts.low} low
            </Badge>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-xs text-slate-400">
            <ShieldAlert className="h-6 w-6 opacity-40 text-emerald-400" />
            <p>No proctoring alerts yet.</p>
            <p className="text-[10px] text-slate-500">
              Candidate focus signals will appear here in real time.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {logs.map((log, i) => {
              const meta = TYPE_META[log.type] || {
                icon: AlertTriangle,
                label: log.type,
              };
              const Icon = meta.icon;
              return (
                <li
                  key={`${log.timestamp}-${i}`}
                  className="flex items-start gap-2 px-3 py-2"
                >
                  <div className="mt-0.5">
                    <Icon className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-200">
                        {meta.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={severityColor(log.severity)}
                      >
                        {log.severity}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {log.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {formatClockTime(log.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
