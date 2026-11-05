import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2 } from 'lucide-react';
import InterviewCard from '../../components/dashboard/InterviewCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import interviewApi from '../../api/interview.api.js';
import toast from 'react-hot-toast';
import {
  INTERVIEW_STATUS,
  INTERVIEW_STATUS_LABELS,
  DEFAULT_PAGE_SIZE,
} from '../../constants/index.js';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  ...Object.values(INTERVIEW_STATUS).map((s) => ({
    value: s,
    label: INTERVIEW_STATUS_LABELS[s],
  })),
];

export default function InterviewListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interviewApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        status: status || undefined,
        search: search || undefined,
      });
      const payload = res?.data?.data;
      const data = Array.isArray(payload) ? payload : payload?.items || [];
      setItems(data);
      setTotalPages(payload?.totalPages || 1);
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const onDuplicate = async (interview) => {
    try {
      await interviewApi.create({
        ...interview,
        title: `${interview.title} (copy)`,
        status: INTERVIEW_STATUS.DRAFT,
      });
      toast.success('Interview duplicated as a draft.');
      fetch();
    } catch {
      // toast handled by interceptor
    }
  };

  const onCancel = async (interview) => {
    if (!confirm(`Cancel "${interview.title}"? This cannot be undone.`)) return;
    try {
      await interviewApi.update(interview.id, { status: INTERVIEW_STATUS.CANCELLED });
      toast.success('Interview cancelled.');
      fetch();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Interviews</h1>
          <p className="text-sm text-slate-500">Manage your scheduled, live, and past sessions.</p>
        </div>
        <Link to="/interviews/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> Schedule Interview
        </Link>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title, candidate email, or role…"
              className="input-base pl-9"
              aria-label="Search interviews"
            />
          </div>
          <button type="submit" className="btn-secondary text-sm">
            Search
          </button>
        </form>
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              type="button"
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                status === f.value
                  ? 'bg-brand-indigo text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              aria-pressed={status === f.value}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading interviews…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No interviews yet"
          description="Schedule your first interview to get started."
          action={
            <Link to="/interviews/new" className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Schedule Interview
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((i) => (
            <InterviewCard
              key={i.id}
              interview={i}
              onDuplicate={onDuplicate}
              onCancel={onCancel}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
