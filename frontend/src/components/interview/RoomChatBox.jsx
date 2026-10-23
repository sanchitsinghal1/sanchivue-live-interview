import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import interviewApi from '../../api/interview.api.js';

// RoomChatBox — messages are stored locally + persisted to the backend via
// `POST /interviews/:id/chat`. Live updates come via the socket's `chat:message`
// event. We deduplicate echoes of our own messages by message id.
export default function RoomChatBox({ interviewId, currentUser, on }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  // Append incoming socket messages (dedup by id).
  useEffect(() => {
    if (!on) return undefined;
    const off = on('chat:message', (msg) => {
      setMessages((prev) => {
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    return off;
  }, [on]);

  // Auto-scroll to bottom on new message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    const optimisticId = `local-${Date.now()}`;
    const localMsg = {
      id: optimisticId,
      userId: currentUser?.id,
      userName: currentUser?.name || 'You',
      content: value,
      timestamp: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, localMsg]);
    setText('');
    setSending(true);
    try {
      const res = await interviewApi.sendChat(interviewId, { content: value });
      const saved = res?.data?.data;
      if (saved) {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, ...saved, pending: false } : m)),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? { ...m, pending: false } : m)),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, pending: false, failed: true } : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-2">
        <MessageSquare className="h-3.5 w-3.5 text-brand-indigo" />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Chat
        </h4>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 space-y-2 overflow-y-auto p-3"
        role="log"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-slate-500">
            No messages yet — say hi!
          </p>
        )}
        {messages.map((m) => {
          const mine = m.userId === currentUser?.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-md px-2.5 py-1.5 text-xs ${
                  mine
                    ? 'bg-brand-indigo text-white'
                    : 'bg-slate-800 text-slate-200'
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[10px] font-semibold text-slate-300">
                    {m.userName || 'Anonymous'}
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-0.5 text-[9px] ${mine ? 'text-white/60' : 'text-slate-500'}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {m.pending && ' · sending…'}
                  {m.failed && ' · failed'}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={submit} className="flex items-center gap-1.5 border-t border-slate-800 p-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="input-base flex-1"
          aria-label="Message"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="grid h-9 w-9 place-items-center rounded-md bg-brand-indigo text-white hover:bg-brand-indigo-dark disabled:opacity-50"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
