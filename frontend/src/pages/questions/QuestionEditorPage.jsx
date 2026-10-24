import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import questionApi from '../../api/question.api.js';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import MonacoEditorWrapper from '../../components/editor/MonacoEditorWrapper.jsx';
import { questionSchema } from '../../validations/question.schema.js';
import {
  LANGUAGES,
  DIFFICULTY,
  DIFFICULTY_LABELS,
} from '../../constants/index.js';

// QuestionEditorPage — create or edit a question. Supports per-language
// starter code + a public/hidden test-case builder.
export default function QuestionEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [activeStarterLang, setActiveStarterLang] = useState('javascript');
  const [starter, setStarter] = useState({});
  const [publicTests, setPublicTests] = useState([]);
  const [hiddenTests, setHiddenTests] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [allowedLanguages, setAllowedLanguages] = useState(['javascript']);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: '',
      statement: '',
      difficulty: DIFFICULTY.MEDIUM,
      type: 'coding',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
    },
  });

  // Hydrate form for edit OR pre-fill from the AI seed (set by QuestionBank).
  useEffect(() => {
    let active = true;
    (async () => {
      // AI seed (from sessionStorage, set by QuestionBank's AI generator).
      const seedRaw = sessionStorage.getItem('sanchivue:questionSeed');
      if (!isEdit && seedRaw) {
        try {
          const seed = JSON.parse(seedRaw);
          if (active) {
            setValue('title', seed.title || '');
            setValue('statement', seed.statement || '');
            setValue('difficulty', seed.difficulty || DIFFICULTY.MEDIUM);
            setTags(Array.isArray(seed.tags) ? seed.tags : []);
          }
        } catch {
          // ignore parse errors
        }
        sessionStorage.removeItem('sanchivue:questionSeed');
      }
      if (isEdit) {
        try {
          const res = await questionApi.get(id);
          const q = res?.data?.data;
          if (active && q) {
            setValue('title', q.title || '');
            setValue('statement', q.statement || '');
            setValue('difficulty', q.difficulty || DIFFICULTY.MEDIUM);
            setValue('type', q.type || 'coding');
            setValue('timeLimitMs', q.timeLimitMs || 2000);
            setValue('memoryLimitMb', q.memoryLimitMb || 256);
            setStarter(q.starterCode || {});
            setPublicTests(q.publicTests || []);
            setHiddenTests(q.hiddenTests || []);
            setTags(q.tags || []);
            setAllowedLanguages(q.allowedLanguages || ['javascript']);
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
  }, [id, isEdit, setValue]);

  const addTag = () => {
    const v = tagInput.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setTagInput('');
  };

  const toggleLanguage = (langId) => {
    setAllowedLanguages((prev) =>
      prev.includes(langId) ? prev.filter((l) => l !== langId) : [...prev, langId],
    );
  };

  const addTestCase = (isHidden) => {
    const tc = { input: '', expectedOutput: '', explanation: '' };
    if (isHidden) setHiddenTests([...hiddenTests, tc]);
    else setPublicTests([...publicTests, tc]);
  };

  const updateTest = (isHidden, idx, field, value) => {
    const setter = isHidden ? setHiddenTests : setPublicTests;
    const list = isHidden ? hiddenTests : publicTests;
    setter(list.map((t, i) => (i === idx ? { ...t, [field]: value } : t)));
  };

  const removeTest = (isHidden, idx) => {
    const setter = isHidden ? setHiddenTests : setPublicTests;
    const list = isHidden ? hiddenTests : publicTests;
    setter(list.filter((_, i) => i !== idx));
  };

  const onSubmit = async (values) => {
    setSaving(true);
    const payload = {
      ...values,
      tags,
      allowedLanguages,
      starterCode: starter,
      publicTests,
      hiddenTests,
    };
    try {
      if (isEdit) {
        await questionApi.update(id, payload);
        toast.success('Question updated.');
      } else {
        const res = await questionApi.create(payload);
        const newId = res?.data?.data?.id;
        toast.success('Question created.');
        navigate(newId ? `/questions/${newId}/edit` : '/questions');
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
        <span className="ml-2 text-sm">Loading question…</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-4xl space-y-6" noValidate>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/questions')}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? 'Save changes' : 'Create question'}
        </button>
      </div>

      <h1 className="text-2xl font-bold text-slate-50">
        {isEdit ? 'Edit question' : 'New question'}
      </h1>

      {/* Basics */}
      <div className="card space-y-4 p-5">
        <Input
          label="Title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="e.g. Two Sum"
        />
        <div>
          <label className="block text-sm font-medium text-slate-200">Statement</label>
          <textarea
            {...register('statement')}
            rows={6}
            className="input-base mt-1.5 resize-y"
            placeholder="Describe the problem…"
          />
          {errors.statement && (
            <p className="mt-1 text-xs text-rose-400">{errors.statement.message}</p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Difficulty"
            {...register('difficulty')}
            options={Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <Select
            label="Type"
            {...register('type')}
            options={[
              { value: 'coding', label: 'Coding' },
              { value: 'system_design', label: 'System Design' },
              { value: 'behavioral', label: 'Behavioral' },
            ]}
          />
          <Input label="Time limit (ms)" type="number" {...register('timeLimitMs')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Memory limit (MB)" type="number" {...register('memoryLimitMb')} />
          <div>
            <label className="block text-sm font-medium text-slate-200">Tags</label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag + Enter"
                className="input-base flex-1"
              />
              <button type="button" onClick={addTag} className="btn-secondary text-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className="badge bg-slate-800 text-slate-200">
                  {t}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((x) => x !== t))}
                    className="ml-1 hover:text-rose-400"
                    aria-label={`Remove ${t}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Allowed languages */}
      <div className="card space-y-3 p-5">
        <h3 className="text-sm font-semibold text-slate-100">Allowed languages</h3>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((l) => {
            const active = allowedLanguages.includes(l.id);
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

      {/* Starter code per language */}
      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Starter code</h3>
          <select
            value={activeStarterLang}
            onChange={(e) => setActiveStarterLang(e.target.value)}
            className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:border-brand-indigo focus:outline-none"
          >
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
        <div className="h-64">
          <MonacoEditorWrapper
            value={starter[activeStarterLang] || ''}
            onChange={(v) => setStarter((p) => ({ ...p, [activeStarterLang]: v }))}
            language={activeStarterLang}
            showLanguageSelector={false}
            height="100%"
          />
        </div>
      </div>

      {/* Test cases */}
      <TestCasesSection
        title="Public test cases"
        tests={publicTests}
        onAdd={() => addTestCase(false)}
        onUpdate={(i, f, v) => updateTest(false, i, f, v)}
        onRemove={(i) => removeTest(false, i)}
      />
      <TestCasesSection
        title="Hidden test cases"
        tests={hiddenTests}
        onAdd={() => addTestCase(true)}
        onUpdate={(i, f, v) => updateTest(true, i, f, v)}
        onRemove={(i) => removeTest(true, i)}
      />

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-primary text-sm">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isEdit ? 'Save changes' : 'Create question'}
        </button>
      </div>
    </form>
  );
}

function TestCasesSection({ title, tests, onAdd, onUpdate, onRemove }) {
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <button type="button" onClick={onAdd} className="btn-secondary text-xs">
          <Plus className="h-3.5 w-3.5" /> Add case
        </button>
      </div>
      {tests.length === 0 && (
        <p className="text-xs text-slate-500">No test cases yet.</p>
      )}
      <ul className="space-y-3">
        {tests.map((t, i) => (
          <li key={i} className="rounded-md border border-slate-800 bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Case {i + 1}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                aria-label={`Remove case ${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Input
                </label>
                <textarea
                  value={t.input}
                  onChange={(e) => onUpdate(i, 'input', e.target.value)}
                  rows={2}
                  className="input-base mt-0.5 resize-y font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Expected output
                </label>
                <textarea
                  value={t.expectedOutput}
                  onChange={(e) => onUpdate(i, 'expectedOutput', e.target.value)}
                  rows={2}
                  className="input-base mt-0.5 resize-y font-mono text-xs"
                />
              </div>
            </div>
            <div className="mt-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500">
                Explanation (optional)
              </label>
              <input
                type="text"
                value={t.explanation || ''}
                onChange={(e) => onUpdate(i, 'explanation', e.target.value)}
                className="input-base mt-0.5 text-xs"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
