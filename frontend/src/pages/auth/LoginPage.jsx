import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, LogIn, Sparkles, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input.jsx';
import PasswordInput from '../../components/forms/PasswordInput.jsx';
import { loginSchema } from '../../validations/auth.schema.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { DEMO_ACCOUNTS } from '../../constants/index.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user?.name?.split(' ')[0] || 'friend'}!`);
      const from = searchParams.get('from');
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      // Toast handled by interceptor
      console.debug('login error', err);
    } finally {
      setLoading(false);
    }
  };

  // Demo quick-fill: pre-populates email + password so reviewers can test the
  // platform without needing a registered account.
  const fillDemo = (acc) => {
    setValue('email', acc.email);
    setValue('password', acc.password);
    toast.success(`Filled ${acc.label} demo credentials.`);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-50">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to your Sanchivue account.</p>
      </div>

      <div className="mb-5 rounded-md border border-slate-800 bg-slate-900/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-brand-indigo" /> Try a demo account
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fillDemo(acc)}
              className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-left text-xs text-slate-300 hover:border-brand-indigo"
            >
              <Wand2 className="h-3.5 w-3.5 text-brand-indigo" />
              <div className="min-w-0">
                <p className="truncate font-medium">{acc.label}</p>
                <p className="truncate text-[10px] text-slate-500">{acc.email}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

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
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          placeholder="Your password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 accent-brand-indigo"
              defaultChecked
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-indigo hover:underline">
            Forgot password?
          </Link>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-indigo hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
