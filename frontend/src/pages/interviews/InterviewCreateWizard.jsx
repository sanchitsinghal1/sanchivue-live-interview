import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Loader2,
  Copy,
  Plus,
  X,
} from 'lucide-react';
import interviewApi from '../../api/interview.api.js';
import questionApi from '../../api/question.api.js';
import aiApi from '../../api/ai.api.js';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import {
  INTERVIEW_TYPE,
  INTERVIEW_TYPE_LABELS,
  DIFFICULTY,
  DIFFICULTY_LABELS,
  LANGUAGES,
  RUBRIC_CRITERIA,
} from '../../constants/index.js';

const STEPS = [
  { id: 'details', label: 'Details' },
  { id: 'questions', label: 'Questions' },
  { id: 'rubric', label: 'Rubric' },
  { id: 'access', label: 'Access' },
  { id: 'review', label: 'Review' },
];

// Default state — kept outside the component so it's stable across renders.
const DEFAULT_STATE = {
  title: '',
  jobRole: '',
  candidateEmail: '',
  jobDescription: '',
  requiredSkills: [],
  type: INTERVIEW_TYPE.CODING,
  difficulty: DIFFICULTY.MEDIUM,
  scheduledAt: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  durationMinutes: 60,
  interviewers: [],
  questionIds: [],
  allowedLanguages: ['javascript', 'python'],
  candidateInstructions: '',
  aiPolicy: 'restricted',
  isPublic: false,
  rubric: Object.fromEntries(RUBRIC_CRITERIA.map((c) => [c.key, 5])),
};

export default function InterviewCreateWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStep = searchParams.get('step') === 'jd' ? 'jd' : 'details';
  const [step, setStep] = useState(initialStep === 'jd' ? 'jd' : 'details');
  const [form, setForm] = useState(DEFAULT_STATE);
  const [questions, setQuestions] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [interviewerInput, setInterviewerInput] = useState('');
  const [jd, setJd] = useState('');
  const [jdLoading, setJdLoading] = useState(false);
  const [jdResult, setJdResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [invitation, setInvitation] = useState(null);

  // Lazy-load the question bank when the user reaches the questions step.
  const loadQuestions = async () => {
    try {
      const res = await questionApi.list({ limit: 50 });
      setQuestions(res?.data?.data || []);
    } catch {
      // ignore — toast handled by interceptor
    }
  };

  // Trigger the lazy load whenever the step becomes 'questions'.
  useEffect(() => {
    if (step === 'questions') loadQuestions();
  }, [step]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addSkill = () => {
    const v = skillInput.trim();
    if (!v) return;
    if (!form.requiredSkills.includes(v)) {
      set('requiredSkills', [...form.requiredSkills, v]);
    }
    setSkillInput('');
  };

  const addInterviewer = () => {
    const v = interviewerInput.trim();
    if (!v) return;
    if (!form.interviewers.includes(v)) {
      set('interviewers', [...form.interviewers, v]);
    }
    setInterviewerInput('');
  };

  const toggleLanguage = (id) => {
    set(
      'allowedLanguages',
      form.allowedLanguages.includes(id)
        ? form.allowedLanguages.filter((l) => l !== id)
        : [...form.allowedLanguages, id],
    );
  };

  const toggleQuestion = (id) => {
    set(
      'questionIds',
      form.questionIds.includes(id)
        ? form.questionIds.filter((q) => q !== id)
        : [...form.questionIds, id],
    );
  };

  const analyzeJd = async () => {
    if (!jd || jd.length < 20) {
      toast.error('Paste a longer job description first.');
      return;
    }
    setJdLoading(true);
    try {
      const res = await aiApi.assessment({ jd });
      const data = res?.data?.data || {};
      setJdResult(data);
      // Auto-fill fields from the AI result if present.
      if (data.jobRole) set('jobRole', data.jobRole);
      if (Array.isArray(data.requiredSkills))
        set('requiredSkills', data.requiredSkills);
      if (Array.isArray(data.suggestedQuestions))
        toast.success(`AI suggested ${data.suggestedQuestions.length} focus areas.`);
    } catch {
      // toast handled by interceptor
    } finally {
      setJdLoading(false);
    }
  };

  const next = () => {
    if (step === 'jd') {
      setStep('details');
      return;
    }
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].id);
  };
  const prev = () => {
    if (step === 'jd') {
      navigate('/dashboard');
      return;
    }
    const idx = STEPS.findIndex((s) => s.id === step);
    if (idx > 0) setStep(STEPS[idx - 1].id);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await interviewApi.create(form);
      const data = res?.data?.data || {};
      setInvitation({
        id: data.id,
        token: data.invitationToken,
        link: data.invitationLink || `${window.location.origin}/join/${data.invitationToken}`,
      });
      toast.success('Interview created!');
      setStep('done');
    } catch {
      // toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (invitation?.link) {
      navigator.clipboard.writeText(invitation.link);
      toast.success('Invitation link copied!');
    }
  };

  // --- Step renderers ---

  if (step === 'jd') {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-50">
            <Sparkles className="h-5 w-5 text-brand-indigo" /> AI Assessment Builder
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Paste a job description. We&apos;ll suggest the role, required skills, and
            focus areas — then drop you into the wizard pre-filled.
          </p>
        </div>
        <div className="card space-y-3 p-5">
          <label htmlFor="jd" className="block text-sm font-medium text-slate-200">
            Job description
          </label>
          <textarea
            id="jd"
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            rows={10}
            className="input-base resize-y"
            placeholder="Paste the full job description here…"
          />
          <button
            type="button"
            onClick={analyzeJd}
            disabled={jdLoading}
            className="btn-primary text-sm"
          >
            {jdLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Analyze with AI
              </>
            )}
          </button>
        </div>
        {jdResult && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-100">AI suggestions</h3>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Detected role</dt>
                <dd className="text-slate-200">{jdResult.jobRole || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Suggested difficulty</dt>
                <dd className="text-slate-200">{jdResult.difficulty || 'medium'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Required skills</dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {(jdResult.requiredSkills || []).map((s) => (
                    <span
                      key={s}
                      className="badge bg-brand-indigo/15 text-brand-indigo"
                    >
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
              {Array.isArray(jdResult.suggestedQuestions) &&
                jdResult.suggestedQuestions.length > 0 && (
                  <div className="sm:col-span-2">
                    <dt className="text-slate-500">Focus areas</dt>
                    <dd>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-slate-300">
                        {jdResult.suggestedQuestions.map((q, i) => (
                          <li key={i}>{typeof q === 'string' ? q : q.text || JSON.stringify(q)}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
            </dl>
          </div>
        )}
        <div className="flex justify-between">
          <button type="button" onClick={prev} className="btn-secondary text-sm">
            <ArrowLeft className="h-4 w-4" /> Cancel
          </button>
          <button type="button" onClick={next} className="btn-primary text-sm">
            Continue to wizard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'done' && invitation) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-emerald/15 text-brand-emerald">
            <Check className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-50">Interview created</h1>
          <p className="mt-2 text-sm text-slate-400">
            Share this secure invitation link with your candidate.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <input
              readOnly
              value={invitation.link}
              className="input-base flex-1 font-mono text-xs"
              aria-label="Invitation link"
            />
            <button type="button" onClick={copyLink} className="btn-secondary text-sm">
              <Copy className="h-4 w-4" /> Copy
            </button>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/interviews/${invitation.id}`)}
              className="btn-secondary text-sm"
            >
              View details
            </button>
            <button
              type="button"
              onClick={() => navigate(`/interviews/${invitation.id}/room`)}
              className="btn-primary text-sm"
            >
              Enter room <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Schedule Interview</h1>
        <p className="text-sm text-slate-500">Multi-step wizard — you can save as a draft at any time.</p>
      </div>

      {/* Stepper */}
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                step === s.id
                  ? 'bg-brand-indigo text-white'
                  : i < stepIdx
                    ? 'bg-brand-emerald/15 text-brand-emerald'
                    : 'bg-slate-800 text-slate-400'
              }`}
              aria-current={step === s.id ? 'step' : undefined}
            >
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                  step === s.id
                    ? 'bg-white/20'
                    : i < stepIdx
                      ? 'bg-brand-emerald/30'
                      : 'bg-slate-700'
                }`}
              >
                {i < stepIdx ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {s.label}
            </button>
          </li>
        ))}
      </ol>

      {/* Step content */}
      <div className="card p-5">
        {step === 'details' && (
          <div className="space-y-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Senior Frontend Engineer — Round 2"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Job role"
                value={form.jobRole}
                onChange={(e) => set('jobRole', e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                required
              />
              <Input
                label="Candidate email"
                type="email"
                value={form.candidateEmail}
                onChange={(e) => set('candidateEmail', e.target.value)}
                placeholder="candidate@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Job description
              </label>
              <textarea
                value={form.jobDescription}
                onChange={(e) => set('jobDescription', e.target.value)}
                rows={5}
                className="input-base mt-1.5 resize-y"
                placeholder="Paste or summarize the JD…"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Required skills
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Add a skill + Enter"
                  className="input-base flex-1"
                />
                <button type="button" onClick={addSkill} className="btn-secondary text-sm">
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {form.requiredSkills.map((s) => (
                  <span
                    key={s}
                    className="badge bg-slate-800 text-slate-200"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => set('requiredSkills', form.requiredSkills.filter((x) => x !== s))}
                      className="ml-1 hover:text-rose-400"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Interview type"
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                options={Object.entries(INTERVIEW_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Select
                label="Difficulty"
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                options={Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Scheduled date & time"
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => set('scheduledAt', e.target.value)}
                required
              />
              <Input
                label="Timezone"
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Duration (minutes)"
                type="number"
                min={15}
                max={240}
                value={form.durationMinutes}
                onChange={(e) => set('durationMinutes', Number(e.target.value))}
              />
              <div>
                <label className="block text-sm font-medium text-slate-200">
                  Interviewers
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    type="email"
                    value={interviewerInput}
                    onChange={(e) => setInterviewerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterviewer())}
                    placeholder="Add interviewer email + Enter"
                    className="input-base flex-1"
                  />
                  <button type="button" onClick={addInterviewer} className="btn-secondary text-sm">
                    <Plus className="h-4 w-4" /> Add
                  </button>
                </div>
                <ul className="mt-2 space-y-1">
                  {form.interviewers.map((email) => (
                    <li
                      key={email}
                      className="flex items-center justify-between rounded bg-slate-800/50 px-2 py-1 text-xs text-slate-200"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => set('interviewers', form.interviewers.filter((x) => x !== email))}
                        className="hover:text-rose-400"
                        aria-label={`Remove ${email}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {step === 'questions' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Pick questions</h3>
              <p className="text-xs text-slate-500">
                You can also pick questions later from the question bank.
              </p>
            </div>
            <div className="space-y-2">
              {questions.length === 0 && (
                <p className="text-xs text-slate-500">
                  No questions yet —{' '}
                  <a href="/questions/new" className="text-brand-indigo hover:underline">
                    create one
                  </a>
                  .
                </p>
              )}
              {questions.map((q) => {
                const checked = form.questionIds.includes(q.id);
                return (
                  <label
                    key={q.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                      checked
                        ? 'border-brand-indigo bg-brand-indigo/5'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleQuestion(q.id)}
                      className="mt-0.5 h-4 w-4 accent-brand-indigo"
                    />
                    <div>
                      <p className="font-medium text-slate-100">{q.title}</p>
                      <p className="text-xs text-slate-500">
                        {q.difficulty} · {q.type}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Allowed languages
              </label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LANGUAGES.map((l) => {
                  const active = form.allowedLanguages.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLanguage(l.id)}
                      className={`rounded px-2 py-1 text-xs font-medium transition ${
                        active
                          ? 'bg-brand-indigo text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      aria-pressed={active}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 'rubric' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Set the rubric</h3>
              <p className="text-xs text-slate-500">
                Default scores seed the live scorecard. The interviewer can adjust during the session.
              </p>
            </div>
            <ul className="space-y-3">
              {RUBRIC_CRITERIA.map((c) => (
                <li key={c.key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">{c.label}</span>
                    <span className="font-mono text-slate-400">{form.rubric[c.key]}/10</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    value={form.rubric[c.key]}
                    onChange={(e) =>
                      set('rubric', { ...form.rubric, [c.key]: Number(e.target.value) })
                    }
                    className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-brand-indigo"
                    aria-label={`${c.label} score`}
                  />
                  <p className="text-[11px] text-slate-500">{c.description}</p>
                </li>
              ))}
            </ul>
            <div>
              <label className="block text-sm font-medium text-slate-200">
                Candidate instructions
              </label>
              <textarea
                value={form.candidateInstructions}
                onChange={(e) => set('candidateInstructions', e.target.value)}
                rows={4}
                className="input-base mt-1.5 resize-y"
                placeholder="Share anything the candidate should know before joining…"
              />
            </div>
          </div>
        )}

        {step === 'access' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Access &amp; AI policy</h3>
            </div>
            <label className="flex items-start gap-3 rounded-md border border-slate-800 bg-slate-950 p-3">
              <input
                type="checkbox"
                checked={form.isPublic}
                onChange={(e) => set('isPublic', e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-indigo"
              />
              <div>
                <p className="text-sm font-medium text-slate-100">Public interview</p>
                <p className="text-xs text-slate-500">
                  Anyone with the invitation link can join as the candidate.
                </p>
              </div>
            </label>
            <Select
              label="AI policy"
              value={form.aiPolicy}
              onChange={(e) => set('aiPolicy', e.target.value)}
              options={[
                { value: 'allowed', label: 'Allowed (candidate may use AI assistants)' },
                { value: 'restricted', label: 'Restricted (no AI assistants)' },
                { value: 'disabled', label: 'Disabled (strict no-AI mode)' },
              ]}
              hint="This is surfaced to the candidate in the waiting room."
            />
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Review &amp; create</h3>
            <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <Review label="Title" value={form.title} />
              <Review label="Job role" value={form.jobRole} />
              <Review label="Candidate email" value={form.candidateEmail || '—'} />
              <Review label="Type" value={INTERVIEW_TYPE_LABELS[form.type]} />
              <Review label="Difficulty" value={DIFFICULTY_LABELS[form.difficulty]} />
              <Review label="Duration" value={`${form.durationMinutes} min`} />
              <Review label="Timezone" value={form.timezone} />
              <Review label="Scheduled at" value={form.scheduledAt || '—'} />
              <Review label="Required skills" value={form.requiredSkills.join(', ') || '—'} />
              <Review label="Languages" value={form.allowedLanguages.join(', ')} />
              <Review label="Questions" value={`${form.questionIds.length} selected`} />
              <Review label="Interviewers" value={form.interviewers.join(', ') || '—'} />
              <Review label="AI policy" value={form.aiPolicy} />
              <Review label="Public" value={form.isPublic ? 'Yes' : 'No'} />
            </dl>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between">
        <button type="button" onClick={prev} className="btn-secondary text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {step === 'review' ? (
          <button type="button" onClick={submit} disabled={saving} className="btn-primary text-sm">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creating…
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Create interview
              </>
            )}
          </button>
        ) : (
          <button type="button" onClick={next} className="btn-primary text-sm">
            Continue <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function Review({ label, value }) {
  return (
    <div className="rounded-md bg-slate-950 p-2">
      <dt className="text-[10px] uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 break-words text-slate-200">{value}</dd>
    </div>
  );
}
