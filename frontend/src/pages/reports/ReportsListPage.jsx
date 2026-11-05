import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, FileText, Search } from 'lucide-react';
import interviewApi from '../../api/interview.api.js';
import { extractItems } from '../../api/axiosInstance.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { INTERVIEW_STATUS } from '../../constants/index.js';
import { formatDateTime, truncate } from '../../utils/formatters.js';

// ReportsListPage — list of ended interviews that have a report ready (or
// pending). The detail page is at `/reports/:id`.
export default function ReportsListPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interviewApi.list({
        limit: 100,
        status: INTERVIEW_STATUS.COMPLETED,
        search: search || undefined,
      });
      setItems(extractItems(res));
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Reports</h1>
        <p className="text-sm text-slate-500">
          Browse past interview reports and debriefs.
        </p>
      </div>

      <div className="card p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by candidate or role…"
            className="input-base pl-9"
            aria-label="Search reports"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading reports…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No reports yet"
          description="Once you end an interview, its report will appear here."
          action={
            <Link to="/interviews" className="btn-secondary text-sm">
              View interviews
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-slate-800">
          {items.map((iv) => (
            <Link
              key={iv.id}
              to={`/reports/${iv.id}`}
              className="flex items-center justify-between gap-3 p-4 transition hover:bg-slate-900/60"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-100">{iv.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {iv.candidateEmail || '—'} · {iv.jobRole}
                </p>
                <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                  {truncate(iv.interviewerNotes || '', 120) || 'No notes yet.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{formatDateTime(iv.endedAt || iv.scheduledAt)}</p>
                <p className="text-[10px] text-slate-500">
                  {iv.passedRatio != null ? `${iv.passedRatio}% match` : 'pending'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
