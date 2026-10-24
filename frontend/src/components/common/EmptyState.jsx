import { Inbox } from 'lucide-react';

// EmptyState — a friendly, centered empty placeholder.
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = '',
  action = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-4 py-12 text-center ${className}`}
    >
      <div className="rounded-full bg-slate-800 p-3 text-slate-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description && <p className="max-w-md text-xs text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
