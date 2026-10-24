import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mail, User } from 'lucide-react';
import interviewApi from '../../api/interview.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { getInitials, colorFromString, formatDate } from '../../utils/formatters.js';

// CandidatesListPage — interviewer-only. Aggregates candidates from past +
// upcoming interviews (the API exposes them via the interviews endpoint).
export default function CandidatesListPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await interviewApi.list({ limit: 100, search: search || undefined });
      const list = res?.data?.data || [];
      // Group interviews by candidate email.
      const map = new Map();
      list.forEach((iv) => {
        const email = iv.candidateEmail || 'unknown';
        if (!map.has(email)) {
          map.set(email, {
            email,
            name: iv.candidateName || email.split('@')[0],
            interviews: [],
          });
        }
        map.get(email).interviews.push(iv);
      });
      setItems(Array.from(map.values()));
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
        <h1 className="text-2xl font-bold text-slate-50">Candidates</h1>
        <p className="text-sm text-slate-500">Candidates who have been invited to your interviews.</p>
      </div>

      <div className="card p-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name or email…"
          className="input-base"
          aria-label="Filter candidates"
        />
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading candidates…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={User}
          title="No candidates yet"
          description="Candidates appear here once they're invited to an interview."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const dot = colorFromString(c.email);
            return (
              <div key={c.email} className="card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white ${dot}`}
                  >
                    {getInitials(c.name || c.email)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-100">{c.name}</p>
                    <p className="truncate text-xs text-slate-500">{c.email}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-slate-400">
                  <p className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {c.interviews.length} interview(s)
                  </p>
                  <p className="mt-1 flex items-center gap-1">
                    Last: {formatDate(c.interviews[0]?.scheduledAt)}
                  </p>
                </div>
                <div className="mt-3 flex justify-end border-t border-slate-800 pt-2">
                  <Link
                    to={`/interviews?search=${encodeURIComponent(c.email)}`}
                    className="btn-ghost text-xs"
                  >
                    View interviews →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
