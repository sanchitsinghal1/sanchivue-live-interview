import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_COLORS,
} from '../../constants/index.js';
import { formatDateTime, formatMinutes } from '../../utils/formatters.js';

// UpcomingList — vertical list of upcoming interviews on the dashboard.
export default function UpcomingList({ items = [], emptyMessage = 'No upcoming interviews.' }) {
  if (!items.length) {
    return (
      <div className="card p-6 text-center text-sm text-slate-500">{emptyMessage}</div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => {
        const status = it.status || 'scheduled';
        return (
          <li key={it.id}>
            <Link
              to={`/interviews/${it.id}`}
              className="card flex items-center justify-between gap-3 p-3 transition hover:border-slate-700"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`badge ${INTERVIEW_STATUS_COLORS[status]}`}>
                    {INTERVIEW_STATUS_LABELS[status]}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-100">
                    {it.title}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateTime(it.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatMinutes(it.durationMinutes)}
                  </span>
                  {it.candidateEmail && (
                    <span className="truncate">{it.candidateEmail}</span>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
