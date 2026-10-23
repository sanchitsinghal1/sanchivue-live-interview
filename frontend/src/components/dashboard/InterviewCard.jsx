import { Link } from 'react-router-dom';
import { Calendar, Clock, Video, MoreVertical, Copy, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';
import {
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_STATUS_COLORS,
  INTERVIEW_STATUS,
  INTERVIEW_TYPE_LABELS,
  LANGUAGE_LABELS,
} from '../../constants/index.js';
import { formatDateTime, formatMinutes } from '../../utils/formatters.js';

// InterviewCard — used in the dashboard upcoming list + the interviews list.
// "View" goes to the live room if the interview is live/scheduled, otherwise
// to the report (if ended) or the editor (if draft).
export default function InterviewCard({ interview, onDuplicate, onCancel }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const status = interview.status || INTERVIEW_STATUS.SCHEDULED;
  const isEnded = status === INTERVIEW_STATUS.ENDED;

  // Primary CTA destination — depends on status:
  //   • ended   → report
  //   • draft   → wizard (continue setup)
  //   • live or scheduled → live room
  const primaryTo = isEnded
    ? `/interviews/${interview.id}/report`
    : status === INTERVIEW_STATUS.DRAFT
      ? `/interviews/new?id=${interview.id}`
      : `/interviews/${interview.id}/room`;

  return (
    <div className="card p-4 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={`badge ${INTERVIEW_STATUS_COLORS[status]}`}
            >
              {INTERVIEW_STATUS_LABELS[status]}
            </span>
            {interview.type && (
              <span className="badge bg-slate-800 text-slate-300">
                {INTERVIEW_TYPE_LABELS[interview.type] || interview.type}
              </span>
            )}
            {interview.difficulty && (
              <span className="badge bg-slate-800 text-slate-300">
                {interview.difficulty}
              </span>
            )}
          </div>
          <h3 className="truncate text-sm font-semibold text-slate-100">
            {interview.title}
          </h3>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {interview.jobRole} · {interview.candidateEmail || 'No candidate yet'}
          </p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800"
            aria-label="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-slate-800 bg-slate-900 py-1 shadow-xl"
              role="menu"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <Link
                to={primaryTo}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
              >
                <Eye className="h-3.5 w-3.5" /> {isEnded ? 'View report' : 'Open'}
              </Link>
              {!isEnded && (
                <Link
                  to={`/interviews/${interview.id}/room`}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  <Video className="h-3.5 w-3.5" /> Enter room
                </Link>
              )}
              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(interview);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-slate-300 hover:bg-slate-800"
                >
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </button>
              )}
              {onCancel && !isEnded && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onCancel(interview);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-rose-400 hover:bg-slate-800"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateTime(interview.scheduledAt)}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formatMinutes(interview.durationMinutes)}
        </div>
      </div>

      {Array.isArray(interview.allowedLanguages) &&
        interview.allowedLanguages.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1">
            {interview.allowedLanguages.slice(0, 4).map((l) => (
              <span
                key={l}
                className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300"
              >
                {LANGUAGE_LABELS[l] || l}
              </span>
            ))}
            {interview.allowedLanguages.length > 4 && (
              <span className="text-[10px] text-slate-500">
                +{interview.allowedLanguages.length - 4}
              </span>
            )}
          </div>
        )}

      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-800 pt-3">
        <Link to={primaryTo} className="btn-ghost text-xs">
          {isEnded ? 'View report' : 'Details'}
        </Link>
        {!isEnded && (
          <Link to={`/interviews/${interview.id}/room`} className="btn-primary text-xs">
            <Video className="h-3.5 w-3.5" /> Enter
          </Link>
        )}
      </div>
    </div>
  );
}
