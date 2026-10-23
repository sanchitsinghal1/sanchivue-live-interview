import { useEffect, useState } from 'react';
import {
  ShieldAlert,
  MousePointerClick,
  Clipboard,
  Maximize,
  ShieldCheck,
} from 'lucide-react';
import {
  PROCTORING_LABELS,
  PROCTORING_TYPES,
} from '../../constants/index.js';
import { formatRelativeTime } from '../../utils/formatters.js';

// ProctoringAlertFeed — interviewer-only live list of proctoring violations.
// Seeds from `initialLogs` (fetched on room mount), then appends live events
// from the collab socket via `on('proctoring:violation')`.
const ICONS = {
  [PROCTORING_TYPES.TAB_SWITCH]: MousePointerClick,
  [PROCTORING_TYPES.WINDOW_BLUR]: ShieldAlert,
  [PROCTORING_TYPES.PASTE_ANOMALY]: Clipboard,
  [PROCTORING_TYPES.FULLSCREEN_EXIT]: Maximize,
};

const SEVERITY_COLORS = {
  low: 'bg-slate-700 text-slate-200',
  medium: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  high: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30',
};

function severityOf(type) {
  if (type === PROCTORING_TYPES.PASTE_ANOMALY) return 'high';
  if (type === PROCTORING_TYPES.TAB_SWITCH) return 'medium';
  return 'low';
}

export default function ProctoringAlertFeed({ initialLogs = [], on }) {
  const [logs, setLogs] = useState(initialLogs);

  // Reset the feed if the parent passes a new initialLogs array (e.g. when
  // switching interviews) using the "adjust state when a prop changes" pattern.
  const [prevKey, setPrevKey] = useState(initialLogs);
  if (prevKey !== initialLogs) {
    setPrevKey(initialLogs);
    setLogs(initialLogs);
  }

  // Subscribe to live socket events.
  useEffect(() => {
    if (!on) return undefined;
    const off = on('proctoring:violation', (entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 100));
    });
    return off;
  }, [on]);

  const counts = logs.reduce((acc, l) => {
    acc[l.type] = (acc[l.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          Proctoring Alerts
        </h4>
        <span className="text-xs text-slate-500">{logs.length} events</span>
      </div>
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 px-3 py-2">
        {Object.entries(PROCTORING_TYPES).map(([_, type]) => (
          <span
            key={type}
            className={`badge ${
              counts[type] ? 'bg-slate-800 text-slate-200' : 'bg-slate-800/40 text-slate-500'
            }`}
          >
            {PROCTORING_LABELS[type]}: {counts[type] || 0}
          </span>
        ))}
      </div>
      <div className="max-h-72 flex-1 space-y-1.5 overflow-y-auto p-2">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-slate-500">
            <ShieldCheck className="h-6 w-6 text-brand-emerald" />
            <span>No proctoring alerts.</span>
          </div>
        ) : (
          logs.map((l, i) => {
            const Icon = ICONS[l.type] || ShieldAlert;
            const severity = l.severity || severityOf(l.type);
            return (
              <div
                key={l.id || `${l.timestamp}-${i}`}
                className="flex items-start gap-2 rounded-md bg-slate-800/50 p-2 text-xs"
              >
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-200">
                      {PROCTORING_LABELS[l.type] || l.type}
                    </span>
                    <span className={`badge ${SEVERITY_COLORS[severity]}`}>{severity}</span>
                  </div>
                  {l.detail && (
                    <p className="mt-0.5 break-words text-[11px] text-slate-500">
                      {typeof l.detail === 'string' ? l.detail : JSON.stringify(l.detail)}
                    </p>
                  )}
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {formatRelativeTime(l.timestamp)} · {l.userId || 'unknown'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
