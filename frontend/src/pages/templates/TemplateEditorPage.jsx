import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import templateApi from '../../api/template.api.js';
import { extractItems } from '../../api/axiosInstance.js';
import questionApi from '../../api/question.api.js';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import {
  LANGUAGES,
  DIFFICULTY,
  DIFFICULTY_LABELS,
  INTERVIEW_TYPE,
  INTERVIEW_TYPE_LABELS,
} from '../../constants/index.js';
import { useOrganization } from '../../context/OrganizationContext.jsx';

const RUBRIC_FIELDS = [
  'problemSolving',
  'correctness',
  'codeQuality',
  'communication',
  'debugging',
  'testing',
  'design',
  'complexity',
];

// TemplateEditorPage — create or edit a reusable interview template. Bundles
// a question set + rubric + duration + allowed languages so a recruiter can
// launch a role-ready interview in one click.
export default function TemplateEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeOrg } = useOrganization();
  const orgId = activeOrg?.id || activeOrg?._id;
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    jobRole: '',
    type: INTERVIEW_TYPE.CODING,
    difficulty: DIFFICULTY.MEDIUM,
    durationMin: 60,
    allowedLanguages: ['javascript'],
    questionIds: [],
    rubric: Object.fromEntries(RUBRIC_FIELDS.map((k) => [k, 5])),
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Hydrate edit OR pre-fill from the duplicate seed set by TemplatesList.
  useEffect(() => {
    let active = true;
    (async () => {
      const seedRaw = sessionStorage.getItem('sanchivue:templateEditorSeed');
      if (!isEdit && seedRaw) {
        try {
          const seed = JSON.parse(seedRaw);
          if (active) {
            setForm((p) => ({
              ...p,
              ...seed,
              rubric: { ...p.rubric, ...(seed.rubric || {}) },
            }));
          }
        } catch {
          // ignore parse errors
        }
        sessionStorage.removeItem('sanchivue:templateEditorSeed');
      }
      if (isEdit) {
        try {
          const res = await templateApi.get(id);
          const tpl = res?.data?.data?.template || res?.data?.data;
          if (active && tpl) {
            setForm({
              name: tpl.name || '',
              description: tpl.description || '',
              jobRole: tpl.jobRole || '',
              type: tpl.type || INTERVIEW_TYPE.CODING,
              difficulty: tpl.difficulty || DIFFICULTY.MEDIUM,
              durationMin: tpl.durationMin || 60,
              allowedLanguages: tpl.allowedLanguages || ['javascript'],
              questionIds: (tpl.questionIds || []).map((q) =>
                typeof q === 'string' ? q : q.id || q._id,
              ),
              rubric: { ...Object.fromEntries(RUBRIC_FIELDS.map((k) => [k, 5])), ...(tpl.rubric || {}) },
            });
          }
        } catch {
          // toast handled by interceptor
        } finally {
          if (active) setLoading(false);
        }
      } else {
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit]);

  // Load question bank for the picker.
  const loadQuestions = async () => {
    try {
      const res = await questionApi.list({ limit: 50, search: search || undefined });
      setQuestions(extractItems(res));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleLanguage = (langId) => {
    set(
      'allowedLanguages',
      form.allowedLanguages.includes(langId)
        ? form.allowedLanguages.filter((l) => l !== langId)
        : [...form.allowedLanguages, langId],
    );
  };

  const toggleQuestion = (qid) => {
    set(
      'questionIds',
      form.questionIds.includes(qid)
        ? form.questionIds.filter((q) => q !== qid)
        : [...form.questionIds, qid],
    );
  };

  const onSubmit = async () => {
    if (!orgId) {
      toast.error('Join or create an organization first.');
      return;
    }
    if (!form.name || form.name.length < 2) {
      toast.error('Give the template a name (min 2 chars).');
      return;
    }
    setSaving(true);
    const payload = { ...form, orgId };
    try {
      if (isEdit) {
        await templateApi.update(id, payload);
        toast.success('Template updated.');
      } else {
        const res = await templateApi.create(payload);
        const newId = res?.data?.data?.template?.id || res?.data?.data?.id;
        toast.success('Template created.');
        navigate(newId ? `/templates/${newId}/edit` : '/templates');
      }
    } catch {
      // toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading template…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button type="button" onClick={onSubmit} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Save changes' : 'Create template'}
        </button>
      </div>

      <h1 className="text-2xl font-bold text-slate-50">
        {isEdit ? 'Edit template' : 'New template'}
      </h1>

      {/* Basics */}
      <div className="card space-y-4 p-5">
        <Input
          label="Template name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="e.g. Senior Frontend Engineer — Round 2"
        />
        <div>
          <label className="block text-sm font-medium text-slate-200">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="input-base mt-1.5 resize-y"
            placeholder="What does this template cover? When should someone use it?"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Job role"
            value={form.jobRole}
            onChange={(e) => set('jobRole', e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
          />
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            max={480}
            value={form.durationMin}
            onChange={(e) => set('durationMin', Number(e.target.value))}
          />
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
      </div>

      {/* Allowed languages */}
      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-100">Allowed languages</h3>
        <div className="flex flex-wrap gap-1.5">
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

      {/* Question picker */}
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-100">
            Questions ({form.questionIds.length} selected)
          </h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="input-base max-w-xs text-xs"
          />
        </div>
        <p className="text-xs text-slate-500">
          The template snapshots question IDs at creation time — future question
          edits don&apos;t silently change what the template tests.
        </p>
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {questions.length === 0 && (
            <li className="text-xs text-slate-500">
              No questions found —{' '}
              <a href="/questions/new" className="text-brand-indigo hover:underline">
                create one
              </a>
              .
            </li>
          )}
          {questions.map((q) => {
            const qid = q.id || q._id;
            const checked = form.questionIds.includes(qid);
            return (
              <li key={qid}>
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm transition ${
                    checked
                      ? 'border-brand-indigo bg-brand-indigo/5'
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleQuestion(qid)}
                    className="mt-0.5 h-4 w-4 accent-brand-indigo"
                  />
                  <div>
                    <p className="font-medium text-slate-100">{q.title}</p>
                    <p className="text-xs text-slate-500">
                      {q.difficulty} · {q.type}
                    </p>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Rubric defaults */}
      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-100">Rubric defaults</h3>
        <p className="text-xs text-slate-500">
          These seed the live scorecard. The interviewer can adjust during the session.
        </p>
        <ul className="space-y-3">
          {RUBRIC_FIELDS.map((key) => (
            <li key={key}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize text-slate-200">{key}</span>
                <span className="font-mono text-slate-400">{form.rubric[key]}/10</span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                value={form.rubric[key]}
                onChange={(e) =>
                  set('rubric', { ...form.rubric, [key]: Number(e.target.value) })
                }
                className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-brand-indigo"
                aria-label={`${key} score`}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/templates')}
          className="btn-secondary text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Cancel
        </button>
        <button type="button" onClick={onSubmit} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </div>
  );
}
