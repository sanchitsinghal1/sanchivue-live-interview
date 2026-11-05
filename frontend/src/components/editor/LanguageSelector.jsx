import { LANGUAGES } from '../../constants/index.js';

// LanguageSelector — a compact dropdown used in the live room toolbar when the
// editor's own selector is hidden.
export default function LanguageSelector({ value, onChange, disabled, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-brand-indigo focus:outline-none ${className}`}
      aria-label="Select programming language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.id} value={l.id}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
