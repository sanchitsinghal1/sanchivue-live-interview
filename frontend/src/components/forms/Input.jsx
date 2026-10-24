import { forwardRef } from 'react';
import FormError from './FormError.jsx';

// Input — a labeled, dark-themed text input. `forwardRef` so react-hook-form
// can register it. We render an optional left icon (e.g. mail, user) and an
// accessible label/error state.
const Input = forwardRef(function Input(
  { label, name, id, type = 'text', icon: Icon, error, hint, className = '', ...props },
  ref,
) {
  const inputId = id || name;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          aria-invalid={!!error}
          className={`input-base ${Icon ? 'pl-9' : ''} ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''
          }`}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <FormError message={error} />}
    </div>
  );
});

export default Input;
