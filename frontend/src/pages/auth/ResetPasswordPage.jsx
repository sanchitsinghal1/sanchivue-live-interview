import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '../../components/forms/PasswordInput.jsx';
import { resetPasswordSchema } from '../../validations/auth.schema.js';
import authApi from '../../api/auth.api.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const tokenFromUrl = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: tokenFromUrl, password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      await authApi.resetPassword({
        token: values.token,
        password: values.password,
      });
      setDone(true);
      toast.success('Password reset. You can now log in.');
      setTimeout(() => navigate('/login'), 1500);
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-50">Reset password</h1>
        <p className="mt-1 text-sm text-slate-400">Choose a new password for your account.</p>
      </div>

      {done ? (
        <div
          className="flex items-start gap-3 rounded-md border border-brand-emerald/30 bg-brand-emerald/5 p-4 text-sm text-brand-emerald"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Password updated. Redirecting to login…</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {!tokenFromUrl && (
            <PasswordInput
              label="Reset token"
              name="token"
              placeholder="Paste the token from your email"
              autoComplete="off"
              error={errors.token?.message}
              {...register('token')}
            />
          )}
          {!tokenFromUrl && (
            <input type="hidden" {...register('token')} />
          )}
          <PasswordInput
            label="New password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Use 8+ chars with a letter and a number."
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat your password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Resetting…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" /> Reset password
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
