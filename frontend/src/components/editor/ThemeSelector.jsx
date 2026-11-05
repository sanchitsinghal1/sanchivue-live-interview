import { Moon, Sun, Monitor } from 'lucide-react';

// ThemeSelector — placeholder for future light-mode support. Currently the
// product is dark-only by design (developer IDE aesthetic), but the selector
// is wired so we can flip a class later without touching every page.
export default function ThemeSelector({ value = 'dark', onChange, className = '' }) {
  const options = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 p-0.5 ${className}`}
      role="group"
      aria-label="Editor theme"
    >
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange?.(v)}
          className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
            value === v ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-pressed={value === v}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
