import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Plus,
  HelpCircle,
  Sparkles,
  ListChecks,
  BarChart3,
  Loader2,
  Users,
  FileText,
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard.jsx';
import UpcomingList from '../../components/dashboard/UpcomingList.jsx';
import interviewApi from '../../api/interview.api.js';
import submissionApi from '../../api/submission.api.js';
import { INTERVIEW_STATUS, ROLES, ACTIVE_STATUSES } from '../../constants/index.js';
import { formatRelativeTime } from '../../utils/formatters.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// DashboardPage — role-aware. For interviewers/admins: aggregate stats from
// /interviews. For candidates: show their assigned interviews + recent submissions.
export default function DashboardPage() {
  const { user } = useAuth();
  const isCandidate = user?.role === ROLES.CANDIDATE;

  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await interviewApi.list({ limit: 50 });
        // Backend returns { items, total, page, limit, totalPages } (aggregate
        // pagination). Extract the items array defensively.
        const payload = res?.data?.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.items || [];
        if (active) setInterviews(list);
        if (isCandidate) {
          try {
            const subRes = await submissionApi.history({ limit: 10 });
            const subPayload = subRes?.data?.data;
            const subs = Array.isArray(subPayload)
              ? subPayload
              : subPayload?.items || [];
            if (active) setSubmissions(subs);
          } catch {
            // ignore — candidate may have no submissions yet
          }
        }
      } catch (err) {
        if (active) setError(err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isCandidate]);

  const stats = useMemo(() => {
    const byStatus = interviews.reduce((acc, i) => {
      acc[i.status] = (acc[i.status] || 0) + 1;
      return acc;
    }, {});
    return {
      // Upcoming = scheduled + ready + in-progress (all active sessions).
      upcoming: interviews.filter((i) => ACTIVE_STATUSES.includes(i.status)).length,
      completed: byStatus[INTERVIEW_STATUS.COMPLETED] || 0,
      inProgress: byStatus[INTERVIEW_STATUS.IN_PROGRESS] || 0,
      drafts: byStatus[INTERVIEW_STATUS.DRAFT] || 0,
      total: interviews.length,
    };
  }, [interviews]);

  const upcoming = useMemo(
    () =>
      interviews
        .filter((i) => ACTIVE_STATUSES.includes(i.status))
        .sort((a, b) => new Date(a.scheduledAt || a.createdAt) - new Date(b.scheduledAt || b.createdAt))
        .slice(0, 6),
    [interviews],
  );

  const pendingEvaluations = useMemo(
    () =>
      interviews
        .filter((i) => i.status === INTERVIEW_STATUS.COMPLETED && !i.hasEvaluation)
        .slice(0, 5),
    [interviews],
  );

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Couldn't load your dashboard"
        description="Please try again in a moment."
        action={
          <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
            Reload
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">
            {isCandidate ? 'Candidate dashboard' : 'Interviewer dashboard'}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-50">
            Welcome, {user?.name?.split(' ')[0] || 'friend'} 👋
          </h1>
        </div>
        {!isCandidate && (
          <div className="flex flex-wrap gap-2">
            <Link to="/interviews/new" className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> Schedule Interview
            </Link>
            <Link to="/questions" className="btn-secondary text-sm">
              <HelpCircle className="h-4 w-4" /> Open Question Bank
            </Link>
            <Link to="/interviews/new?step=jd" className="btn-ghost text-sm">
              <Sparkles className="h-4 w-4 text-brand-indigo" /> AI Assessment Builder
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          hint="Scheduled + live"
          icon="calendar"
          accent="indigo"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          hint="Live right now"
          icon="clock"
          accent="emerald"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          hint="Ended sessions"
          icon="check"
          accent="emerald"
        />
        {!isCandidate ? (
          <StatCard
            label="Drafts"
            value={stats.drafts}
            hint="Not yet scheduled"
            icon="trend"
            accent="amber"
          />
        ) : (
          <StatCard
            label="Submissions"
            value={submissions.length}
            hint="Recent runs"
            icon="trend"
            accent="amber"
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Calendar className="h-4 w-4 text-brand-indigo" /> Upcoming interviews
            </h2>
            <Link to="/interviews" className="text-xs text-brand-indigo hover:underline">
              View all
            </Link>
          </div>
          <UpcomingList
            items={upcoming}
            emptyMessage="No upcoming interviews. Schedule one to get started."
          />
        </div>

        {/* Right column: pending evaluations (interviewers) OR submission history (candidates) */}
        <div>
          {!isCandidate ? (
            <>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <ListChecks className="h-4 w-4 text-amber-400" /> Pending evaluations
              </h2>
              {pendingEvaluations.length === 0 ? (
                <div className="card p-4 text-xs text-slate-500">
                  No pending evaluations — you&apos;re all caught up.
                </div>
              ) : (
                <ul className="space-y-2">
                  {pendingEvaluations.map((i) => (
                    <li key={i.id}>
                      <Link
                        to={`/interviews/${i.id}/report`}
                        className="card flex items-center justify-between gap-3 p-3 hover:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-slate-100">{i.title}</p>
                          <p className="text-xs text-slate-500">{i.candidateEmail || '—'}</p>
                        </div>
                        <span className="badge bg-amber-500/15 text-amber-300">
                          <Clock className="h-3 w-3" /> Evaluate
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <BarChart3 className="h-4 w-4 text-brand-indigo" /> Recent submissions
              </h2>
              {submissions.length === 0 ? (
                <div className="card p-4 text-xs text-slate-500">
                  You haven&apos;t run any code yet. Join an interview to begin.
                </div>
              ) : (
                <ul className="space-y-2">
                  {submissions.slice(0, 6).map((s) => (
                    <li key={s.id} className="card flex items-center justify-between p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-slate-200">
                          {s.questionTitle || s.questionId || 'Submission'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {formatRelativeTime(s.createdAt)} · {s.language}
                        </p>
                      </div>
                      <span
                        className={`badge ${
                          s.passed
                            ? 'bg-brand-emerald/15 text-brand-emerald'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {s.passed ? 'Passed' : 'Failed'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick actions row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          to="/interviews/new"
          icon={Calendar}
          title="Schedule an interview"
          desc="Create a new live session with a candidate."
        />
        {!isCandidate && (
          <QuickAction
            to="/questions"
            icon={HelpCircle}
            title="Open Question Bank"
            desc="Browse, create, or edit interview questions."
          />
        )}
        <QuickAction
          to="/reports"
          icon={FileText}
          title="View reports"
          desc={isCandidate ? 'Review your past interview reports.' : 'Read debriefs from past sessions.'}
        />
      </div>

      {/* Candidate pipeline (interviewer-only) */}
      {!isCandidate && (
        <div className="card p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Users className="h-4 w-4 text-brand-emerald" /> Candidate pipeline
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.values(INTERVIEW_STATUS).map((s) => {
              const count = interviews.filter((i) => i.status === s).length;
              return (
                <div
                  key={s}
                  className="rounded-md border border-slate-800 bg-slate-950 p-3 text-center"
                >
                  <p className="text-2xl font-bold text-slate-100">{count}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{s}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ to, icon: Icon, title, desc }) {
  return (
    <Link to={to} className="card flex items-start gap-3 p-4 transition hover:border-slate-700">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-brand-indigo/10 text-brand-indigo">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-100">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </Link>
  );
}
