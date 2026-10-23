import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, User, UserPlus, Briefcase, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input.jsx';
import PasswordInput from '../../components/forms/PasswordInput.jsx';
import { registerSchema } from '../../validations/auth.schema.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../constants/index.js';

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

  return (
    <div className="animate-fade-in">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-50">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Start running live interviews in minutes.</p>
      </div>

      {/* Role selector — defaults to interviewer */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-slate-200">I am a…</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole(ROLES.INTERVIEWER)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
              role === ROLES.INTERVIEWER
                ? 'border-brand-indigo bg-brand-indigo/10 text-white'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'
            }`}
            aria-pressed={role === ROLES.INTERVIEWER}
          >
            <Briefcase className="h-4 w-4" />
            Interviewer
          </button>
          <button
            type="button"
            onClick={() => setRole(ROLES.CANDIDATE)}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${
              role === ROLES.CANDIDATE
                ? 'border-brand-emerald bg-brand-emerald/10 text-white'
                : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-600'
            }`}
            aria-pressed={role === ROLES.CANDIDATE}
          >
            <GraduationCap className="h-4 w-4" />
            Candidate
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          name="name"
          icon={User}
          placeholder="Jane Doe"
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
          placeholder="At least 8 characters"
          hint="Use 8+ chars with a letter and a number."
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

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-indigo hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
