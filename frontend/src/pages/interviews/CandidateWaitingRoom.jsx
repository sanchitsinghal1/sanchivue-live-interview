import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Camera,
  Mic,
  Wifi,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import interviewApi from '../../api/interview.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  INTERVIEW_STATUS_LABELS,
  DIFFICULTY_LABELS,
  LANGUAGE_LABELS,
} from '../../constants/index.js';

// CandidateWaitingRoom — validates the invitation token, shows instructions,
// runs device/connection checks, then lets the candidate join the live room.
export default function CandidateWaitingRoom() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState(null);
  const [checks, setChecks] = useState({
    camera: { running: false, ok: false, msg: '' },
    mic: { running: false, ok: false, msg: '' },
    connection: { running: false, ok: false, msg: '' },
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await interviewApi.validateInvitation(token);
        if (active) setInterview(res?.data?.data || null);
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message || 'This invitation link is invalid or has expired.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  // Mark "connection" check as soon as we successfully fetched the interview.
  useEffect(() => {
    if (interview) {
      setChecks((p) => ({
        ...p,
        connection: { running: false, ok: true, msg: 'Connected to Sanchivue.' },
      }));
    }
  }, [interview]);

  const runCamera = async () => {
    setChecks((p) => ({ ...p, camera: { running: true, ok: false, msg: 'Requesting…' } }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setChecks((p) => ({ ...p, camera: { running: false, ok: true, msg: 'Camera ready.' } }));
    } catch (err) {
      setChecks((p) => ({
        ...p,
        camera: {
          running: false,
          ok: false,
          msg:
            err?.name === 'NotAllowedError'
              ? 'Permission denied. Please allow camera access in your browser.'
              : 'No camera detected.',
        },
      }));
    }
  };

  const runMic = async () => {
    setChecks((p) => ({ ...p, mic: { running: true, ok: false, msg: 'Requesting…' } }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setChecks((p) => ({ ...p, mic: { running: false, ok: true, msg: 'Microphone ready.' } }));
    } catch (err) {
      setChecks((p) => ({
        ...p,
        mic: {
          running: false,
          ok: false,
          msg:
            err?.name === 'NotAllowedError'
              ? 'Permission denied. Please allow microphone access.'
              : 'No microphone detected.',
        },
      }));
    }
  };

  const runAllChecks = async () => {
    await Promise.all([runCamera(), runMic()]);
  };

  const canJoin = interview && checks.connection.ok;

  const join = async () => {
    try {
      // If the candidate is signed in, just go to the room.
      if (user) {
        toast.success('Joining interview…');
        navigate(`/interviews/${interview.id}/room`);
        return;
      }
      // Otherwise, ask the backend to issue a candidate session — the response
      // should contain a short-lived candidate user + access token.
      const res = await interviewApi.join(interview.id);
      const data = res?.data?.data || {};
      if (data.accessToken && data.user) {
        await login({
          email: data.user.email,
          password: '', // cookie-based, candidate pre-authed
        }).catch(() => {});
        // Fallback: if login requires password, navigate to /login then to room.
      }
      navigate(`/interviews/${interview.id}/room`);
    } catch (err) {
      // Interceptor surfaces a generic toast; add a contextual hint too.
      const msg = err?.response?.data?.message;
      if (msg) toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-brand-indigo" />
        <p className="mt-3 text-sm">Validating your invitation…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-400" />
        <h1 className="mt-4 text-xl font-bold text-slate-50">Invitation invalid</h1>
        <p className="mt-2 max-w-md text-sm text-slate-400">{error}</p>
        <Link to="/" className="btn-secondary mt-6 text-sm">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-300">
            <Sparkles className="h-3 w-3 text-brand-indigo" /> You&apos;re joining a Sanchivue interview
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-50">{interview?.title}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {interview?.jobRole} · {INTERVIEW_STATUS_LABELS[interview?.status]}
          </p>
        </div>

        {/* Instructions */}
        <div className="card mb-6 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Before you join</h2>
          <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-emerald" />
              Use a quiet, well-lit space with a stable internet connection.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-emerald" />
              Allow camera + microphone access when prompted.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-emerald" />
              Stay in the interview tab. Switching tabs/windows may be logged.
            </li>
            <li className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-emerald" />
              AI policy:{' '}
              <span className="font-medium text-slate-100">{interview?.aiPolicy || 'restricted'}</span>.
            </li>
            {interview?.candidateInstructions && (
              <li className="mt-2 rounded-md bg-slate-800/40 p-2 text-slate-300">
                {interview.candidateInstructions}
              </li>
            )}
          </ul>
        </div>

        {/* Device checks */}
        <div className="card mb-6 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Device readiness</h2>
            <button type="button" onClick={runAllChecks} className="btn-secondary text-xs">
              Run all checks
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            <CheckRow
              icon={Camera}
              label="Camera"
              check={checks.camera}
              onRun={runCamera}
            />
            <CheckRow
              icon={Mic}
              label="Microphone"
              check={checks.mic}
              onRun={runMic}
            />
            <CheckRow
              icon={Wifi}
              label="Connection"
              check={checks.connection}
            />
          </ul>
          <p className="mt-3 text-[11px] text-slate-500">
            Camera + mic access is required for the full experience. You can still join
            without them, but the interviewer may ask you to enable them.
          </p>
        </div>

        {/* Interview meta */}
        <div className="card mb-6 p-5">
          <h2 className="text-sm font-semibold text-slate-100">Interview details</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
            <Meta label="Difficulty" value={DIFFICULTY_LABELS[interview?.difficulty] || '—'} />
            <Meta label="Duration" value={`${interview?.durationMinutes || 60} min`} />
            <Meta label="Languages" value={(interview?.allowedLanguages || []).map((l) => LANGUAGE_LABELS[l] || l).join(', ')} />
            <Meta label="Scheduled" value={new Date(interview?.scheduledAt).toLocaleString()} />
          </dl>
        </div>

        {/* Join */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={join}
            disabled={!canJoin}
            className="btn-primary"
          >
            Enter interview <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ icon: Icon, label, check, onRun }) {
  return (
    <li className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {check.running && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
        {!check.running && check.msg && (
          <span
            className={`flex items-center gap-1 text-xs ${
              check.ok ? 'text-brand-emerald' : 'text-amber-300'
            }`}
          >
            {check.ok ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            {check.msg}
          </span>
        )}
        {onRun && (
          <button type="button" onClick={onRun} className="btn-ghost text-xs">
            Test
          </button>
        )}
      </div>
    </li>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-200">{value}</dd>
    </div>
  );
}
