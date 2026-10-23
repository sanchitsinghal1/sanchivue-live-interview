import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import FormError from './FormError.jsx';

// PasswordInput — Input with a show/hide button and a lock icon.
const PasswordInput = forwardRef(function PasswordInput(
  { label, name, id, error, hint, autoComplete = 'current-password', className = '', ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  const inputId = id || name;
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-200">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
          <Lock className="h-4 w-4" />
        </span>
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`input-base pl-9 pr-10 ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''
          }`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <FormError message={error} />}
    </div>
  );
});

export default PasswordInput;
