import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Mail, Send, Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input.jsx';
import { forgotPasswordSchema } from '../../validations/auth.schema.js';
import authApi from '../../api/auth.api.js';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { ok, message }
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(values);
      const data = res?.data || {};
      const message =
        data.message ||
        'If an account with that email exists, a reset link has been sent.';
      setResult({ ok: true, message });
      toast.success('Reset link requested.');
    } catch (err) {
      // Surface backend message (e.g. "email not configured" if no SMTP).
      const msg =
        err?.response?.data?.message ||
        'Could not request a reset. Please try again later.';
      setResult({ ok: false, message: msg });
      toast.error(msg);
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
        <h1 className="text-2xl font-bold text-slate-50">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-400">
          We&apos;ll send a reset link to your email.
        </p>
      </div>

      {result ? (
        <div
          className={`flex items-start gap-3 rounded-md border p-4 text-sm ${
            result.ok
              ? 'border-brand-emerald/30 bg-brand-emerald/5 text-brand-emerald'
              : 'border-amber-500/30 bg-amber-500/5 text-amber-300'
          }`}
          role="status"
        >
          {result.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Input
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            placeholder="you@company.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send reset link
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
