"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { getSocket } from "@/lib/socket-client";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatClockTime } from "@/lib/format";
import type { ChatMessage, PublicUser } from "@/lib/client-types";

interface RoomChatBoxProps {
  roomCode: string;
  interviewId: string;
  user: PublicUser;
  initialMessages?: ChatMessage[];
  className?: string;
}

/**
 * Live chat box for the interview room. Messages are emitted over the socket
 * for real-time delivery AND persisted via PATCH /interviews/[id] so they're
 * preserved for the post-session report.
 */
export function RoomChatBox({
  roomCode,
  interviewId,
  user,
  initialMessages = [],
  className,
}: RoomChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Reset local messages when the interview changes. We compare the previous
  // interviewId and synchronously adjust state during render (the React
  // "adjusting state when a prop changes" pattern) to avoid setState-in-effect.
  const [prevInterviewId, setPrevInterviewId] = useState(interviewId);
  if (prevInterviewId !== interviewId) {
    setPrevInterviewId(interviewId);
    setMessages(initialMessages);
  }

  // Listen for incoming chat messages.
  useEffect(() => {
    const socket = getSocket();
    function onMessage(msg: ChatMessage) {
      if (!msg || typeof msg.content !== "string") return;
      // De-dupe: drop a message if we just added it locally.
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          last.userId === msg.userId &&
          last.timestamp === msg.timestamp &&
          last.content === msg.content
        ) {
          return prev;
        }
        return [...prev, msg];
      });
    }
    socket.on("chat:message", onMessage);
    return () => {
      socket.off("chat:message", onMessage);
    };
  }, []);

  // Auto-scroll on new messages.
  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  async function send() {
    const content = input.trim();
    if (!content) return;
    const msg: ChatMessage = {
      userId: user.id,
      userName: user.name,
      content,
      timestamp: Date.now(),
    };
    // Optimistically append locally.
    setMessages((prev) => [...prev, msg]);
    setInput("");
    try {
      const socket = getSocket();
      socket.emit("chat:message", {
        roomCode,
        userId: msg.userId,
        userName: msg.userName,
        content: msg.content,
        timestamp: msg.timestamp,
      });
    } catch {
      /* socket not connected — still persist */
    }
    try {
      await api.patch(`/interviews/${interviewId}`, { appendChat: msg });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save chat.");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className={"flex flex-col " + (className || "")}>
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Room chat
        </span>
        <span className="text-[10px] text-slate-500">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 py-8 text-center text-xs text-slate-500">
            <span>No messages yet.</span>
            <span>Say hello 👋</span>
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m, i) => {
              const mine = m.userId === user.id;
              return (
                <li
                  key={`${m.timestamp}-${i}`}
                  className={"flex " + (mine ? "justify-end" : "justify-start")}
                >
                  <div className="max-w-[85%]">
                    {!mine && (
                      <div className="mb-0.5 text-[10px] font-medium text-slate-400">
                        {m.userName}
                      </div>
                    )}
                    <div
                      className={
                        "rounded-lg px-2.5 py-1.5 text-xs leading-relaxed " +
                        (mine
                          ? "bg-indigo-500/80 text-white"
                          : "bg-white/5 text-slate-200 border border-white/10")
                      }
                    >
                      <span className="whitespace-pre-wrap break-words">
                        {m.content}
                      </span>
                    </div>
                    <div
                      className={
                        "mt-0.5 text-[9px] text-slate-500 " +
                        (mine ? "text-right" : "text-left")
                      }
                    >
                      {formatClockTime(m.timestamp)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div ref={listEndRef} />
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/10 p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a message…"
          className="h-8 border-white/10 bg-white/5 text-xs text-slate-100"
          aria-label="Chat message"
        />
        <Button
          size="icon"
          onClick={send}
          disabled={!input.trim()}
          className="h-8 w-8 shrink-0 bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
          aria-label="Send message"
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
