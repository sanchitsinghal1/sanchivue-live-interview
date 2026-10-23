import {
  BarChart3,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
} from 'lucide-react';

// StatCard — compact KPI card for the dashboard. We accept an icon name to
// avoid passing components (keeps the prop API simple).
const ICONS = {
  interviews: BarChart3,
  calendar: Calendar,
  users: Users,
  check: CheckCircle2,
  clock: Clock,
  trend: TrendingUp,
};

export default function StatCard({
  label,
  value,
  hint,
  icon = 'trend',
  accent = 'indigo',
}) {
  const Icon = ICONS[icon] || BarChart3;
  const accentClass =
    accent === 'emerald'
      ? 'from-brand-emerald/20 to-transparent text-brand-emerald'
      : accent === 'amber'
        ? 'from-amber-500/20 to-transparent text-amber-400'
        : 'from-brand-indigo/20 to-transparent text-brand-indigo';

  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentClass} opacity-50`}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-100">{value}</p>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        </div>
        <div className="rounded-md bg-slate-800/60 p-2">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
