import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { formatDurationMs } from '../../utils/formatters.js';

// InterviewTimer — counts up from `startedAt` (or counts down if `endsAt` given
// and is in the future). Updates every second; cleans up the interval on unmount.
export default function InterviewTimer({ startedAt, endsAt }) {
  const [now, setNow] = useState(Date.now());
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = () => {
      setNow(Date.now());
      rafRef.current = setTimeout(tick, 1000);
    };
    rafRef.current = setTimeout(tick, 1000);
    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
  }, []);

  if (endsAt) {
    const remaining = new Date(endsAt).getTime() - now;
    if (remaining <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 px-2 py-1 font-mono text-xs text-rose-300">
          <Clock className="h-3.5 w-3.5" /> 00:00:00
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-200">
        <Clock className="h-3.5 w-3.5 text-brand-emerald" />
        {formatDurationMs(remaining)}
      </span>
    );
  }

  if (!startedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5" /> 00:00:00
      </span>
    );
  }

  const elapsed = now - new Date(startedAt).getTime();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2 py-1 font-mono text-xs text-slate-200">
      <Clock className="h-3.5 w-3.5 text-brand-emerald" />
      {formatDurationMs(elapsed)}
    </span>
  );
}
