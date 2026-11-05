import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import FormError from './FormError.jsx';

// Select — a styled native <select>. We keep it native (not a custom dropdown)
// because it's keyboard + screen-reader accessible for free.
const Select = forwardRef(function Select(
  {
    label,
    name,
    id,
    options = [], // [{ value, label }]
    error,
    hint,
    placeholder = 'Select…',
    className = '',
    children,
    ...props
  },
  ref,
) {
  const selectId = id || name;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          name={name}
          aria-invalid={!!error}
          className={`input-base appearance-none pr-9 ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''
          }`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {children}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
          <ChevronDown className="h-4 w-4" />
        </span>
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <FormError message={error} />}
    </div>
  );
});

export default Select;
