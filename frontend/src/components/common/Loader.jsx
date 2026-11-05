export default function Loader({ label = 'Loading…', className = '' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-3 py-10 text-slate-400 ${className}`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-brand-indigo"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
