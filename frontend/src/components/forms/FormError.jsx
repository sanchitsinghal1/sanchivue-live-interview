import { AlertCircle } from 'lucide-react';

// FormError — small inline error message used by Input/PasswordInput/Select.
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-xs font-medium text-rose-400"
    >
      <AlertCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </p>
  );
}
