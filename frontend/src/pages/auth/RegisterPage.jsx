import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  User,
  UserPlus,
  Briefcase,
  GraduationCap,
  Wand2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input.jsx';
import PasswordInput from '../../components/forms/PasswordInput.jsx';
import { registerSchema } from '../../validations/auth.schema.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES, DEMO_ACCOUNTS } from '../../constants/index.js';

const ROLE_CHOICES = [
  {
    value: ROLES.INTERVIEWER,
    label: 'Interviewer',
    icon: Briefcase,
    caption: 'I\'ll be conducting interviews',
  },
  {
    value: ROLES.CANDIDATE,
    label: 'Candidate',
    icon: GraduationCap,
    caption: 'I\'ll be taking interviews',
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(ROLES.INTERVIEWER);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: ROLES.INTERVIEWER,
    },
  });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const user = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password,
        role,
      });
      toast.success(`Welcome to Sanchivue, ${user?.name?.split(' ')[0] || 'friend'}!`);
      const from = searchParams.get('from');
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      console.debug('register error', err);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    // Demo quick-fill is a reviewer convenience — same idea as the login page.
    toast.success(`Try the ${acc.label} demo from the login page instead.`);
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-50">Create your account</h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Start running live interviews in minutes. No credit card required.
        </p>
      </div>

      {/* Role selector — framed as a deliberate choice, not a form field */}
      <fieldset className="mb-6">
        <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          I&apos;m joining as
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLE_CHOICES.map((c) => {
            const active = role === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setRole(c.value)}
                className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition ${
                  active
                    ? c.value === ROLES.INTERVIEWER
                      ? 'border-brand-indigo bg-brand-indigo/10'
                      : 'border-brand-emerald bg-brand-emerald/10'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
                aria-pressed={active}
                aria-label={`Join as ${c.label}`}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-md ${
                    active
                      ? c.value === ROLES.INTERVIEWER
                        ? 'bg-brand-indigo text-white'
                        : 'bg-brand-emerald text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <c.icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold text-slate-100">{c.label}</span>
                <span className="text-[11px] text-slate-400">{c.caption}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          name="name"
          icon={User}
          placeholder="Sanchit Singhal"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          placeholder="Create a password"
          hint="Use 8+ characters with a mix of letters and numbers."
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Create account
            </>
          )}
        </button>
      </form>

      {/* Demo quick-fill — kept as a reviewer convenience */}
      <div className="mt-6 rounded-md border border-slate-800 bg-slate-900/60 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-brand-indigo" /> Quick demo access
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
        <p className="mt-2 text-[10px] text-slate-500">
          Demos sign in on the{' '}
          <Link to="/login" className="text-brand-indigo hover:underline">
            login page
          </Link>
          .
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-indigo hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
