"use client";

import { useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  Users as UsersIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PresenceUser, PublicUser } from "@/lib/client-types";

interface VideoCallGridProps {
  user: PublicUser;
  presence: PresenceUser[];
  /** Fallback participants when no presence yet (e.g. interviewer + candidate). */
  fallbackParticipants?: Array<{ id: string; name: string; role: string }>;
  className?: string;
}

interface TileState {
  micOn: boolean;
  camOn: boolean;
  sharing: boolean;
}

/**
 * Mock WebRTC video-call grid. The sandbox blocks getUserMedia, so this is a
 * tasteful visual mock: one tile per participant with avatar initials on a
 * gradient background, mic/cam/share toggles that flip local state only.
 */
export function VideoCallGrid({
  user,
  presence,
  fallbackParticipants = [],
  className,
}: VideoCallGridProps) {
  // Build the participant list: always include the local user + presence
  // users (de-duped by id). Fallbacks are used only when presence is empty.
  const participants: { id: string; name: string; role: string }[] = (() => {
    const list: { id: string; name: string; role: string }[] = [
      { id: user.id, name: user.name, role: user.role },
    ];
    if (presence.length > 0) {
      for (const p of presence) {
        if (p.userId !== user.id) {
          list.push({ id: p.userId, name: p.userName, role: p.role });
        }
      }
    } else {
      for (const p of fallbackParticipants) {
        if (p.id !== user.id) {
          list.push({ id: p.id, name: p.name, role: p.role });
        }
      }
    }
    return list;
  })();

  const [tileStates, setTileStates] = useState<Record<string, TileState>>(
    () => {
      const initial: Record<string, TileState> = {};
      for (const p of participants) {
        initial[p.id] = { micOn: true, camOn: true, sharing: false };
      }
      return initial;
    }
  );

  // When the participant list changes (someone joins/leaves), seed defaults
  // for new tiles and keep existing states. We use the React "adjust state
  // when a prop changes" pattern (synchronous during render) so we don't
  // trigger setState-in-effect cascading renders.
  const presenceKey = `${presence.length}:${fallbackParticipants.length}`;
  const [prevPresenceKey, setPrevPresenceKey] = useState(presenceKey);
  if (presenceKey !== prevPresenceKey) {
    setPrevPresenceKey(presenceKey);
    setTileStates((prev) => {
      const next: Record<string, TileState> = {};
      for (const p of participants) {
        next[p.id] = prev[p.id] || { micOn: true, camOn: true, sharing: false };
      }
      return next;
    });
  }

  function toggle(id: string, key: keyof TileState) {
    setTileStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: !prev[id][key] },
    }));
  }

  return (
    <div className={"flex flex-col " + (className || "")}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-300">
          <UsersIcon className="h-3.5 w-3.5 text-indigo-400" />
          Call
        </span>
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        >
          <span className="mr-1 h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {participants.map((p) => {
          const isMe = p.id === user.id;
          const initials = p.name
            .split(" ")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const st = tileStates[p.id] || {
            micOn: true,
            camOn: true,
            sharing: false,
          };
          const tileGradient =
            p.role === "interviewer"
              ? "from-indigo-500 to-violet-500"
              : p.role === "admin"
                ? "from-rose-500 to-pink-500"
                : "from-emerald-500 to-teal-500";
          return (
            <div
              key={p.id}
              className="relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[oklch(0.13_0.02_264)]"
            >
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white",
                  tileGradient,
                  st.camOn ? "" : "opacity-30"
                )}
              >
                {st.camOn ? initials : <VideoOff className="h-5 w-5" />}
              </div>
              <div className="mt-2 max-w-full truncate text-[11px] font-medium text-slate-200">
                {p.name}
                {isMe && <span className="text-slate-500"> (you)</span>}
              </div>
              <Badge
                variant="outline"
                className="mt-0.5 border-white/10 bg-white/5 text-[9px] text-slate-300"
              >
                {p.role}
              </Badge>
              {st.sharing && (
                <Badge
                  variant="outline"
                  className="absolute left-1.5 top-1.5 border-indigo-500/40 bg-indigo-500/15 text-[9px] text-indigo-300"
                >
                  <ScreenShare className="mr-0.5 h-2.5 w-2.5" />
                  Sharing
                </Badge>
              )}
              {/* Local controls — only the local user can toggle their mic/cam/share. */}
              {isMe && (
                <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
                  <IconButton
                    active={st.micOn}
                    onClick={() => toggle(p.id, "micOn")}
                    title={st.micOn ? "Mute" : "Unmute"}
                  >
                    {st.micOn ? (
                      <Mic className="h-3 w-3" />
                    ) : (
                      <MicOff className="h-3 w-3" />
                    )}
                  </IconButton>
                  <IconButton
                    active={st.camOn}
                    onClick={() => toggle(p.id, "camOn")}
                    title={st.camOn ? "Turn off camera" : "Turn on camera"}
                  >
                    {st.camOn ? (
                      <Video className="h-3 w-3" />
                    ) : (
                      <VideoOff className="h-3 w-3" />
                    )}
                  </IconButton>
                  <IconButton
                    active={st.sharing}
                    onClick={() => toggle(p.id, "sharing")}
                    title={st.sharing ? "Stop sharing" : "Share screen"}
                  >
                    {st.sharing ? (
                      <ScreenShareOff className="h-3 w-3" />
                    ) : (
                      <ScreenShare className="h-3 w-3" />
                    )}
                  </IconButton>
                </div>
              )}
              {!isMe && !st.micOn && (
                <div className="absolute bottom-1.5 right-1.5 rounded-full bg-rose-500/20 p-1 text-rose-300">
                  <MicOff className="h-3 w-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IconButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      size="icon"
      variant="outline"
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        "h-6 w-6 rounded-full border-white/15 p-0",
        active
          ? "bg-white/10 text-slate-100 hover:bg-white/20"
          : "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
      )}
    >
      {children}
    </Button>
  );
}
