import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Loader2, Plus, Trash2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import questionApi from '../../api/question.api.js';
import Input from '../../components/forms/Input.jsx';
import Select from '../../components/forms/Select.jsx';
import Modal from '../../components/common/Modal.jsx';
import MonacoEditorWrapper from '../../components/editor/MonacoEditorWrapper.jsx';
import { questionSchema } from '../../validations/question.schema.js';
import {
  LANGUAGES,
  DIFFICULTY,
  DIFFICULTY_LABELS,
} from '../../constants/index.js';

// Topic options for the in-editor AI generator. Mirrors the QuestionBankPage
// list so the local fallback in the backend service always picks a sensible match.
const AI_TOPICS = [
  { value: 'arrays', label: 'Arrays & Hashing' },
  { value: 'strings', label: 'Strings & Parsing' },
  { value: 'sliding window', label: 'Sliding Window' },
  { value: 'trees', label: 'Trees / BST' },
  { value: 'graphs', label: 'Graphs / BFS / DFS' },
  { value: 'dp', label: 'Dynamic Programming' },
  { value: 'design', label: 'System Design / OO Design' },
  { value: 'stack', label: 'Stack / Queue' },
  { value: 'linked list', label: 'Linked List' },
  { value: 'general', label: 'General / Other' },
];
const AI_DIFFICULTIES = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];
const AI_TYPES = [
  { value: 'coding', label: 'Coding' },
  { value: 'discussion', label: 'Discussion' },
];

// Capitalize a difficulty string ('easy' | 'medium' | 'hard' | 'Easy' | ...) to
// the backend's canonical 'Easy'/'Medium'/'Hard' enum value.
function capitalizeDifficulty(v) {
  if (!v || typeof v !== 'string') return 'Medium';
  const lower = v.toLowerCase();
  if (lower === 'easy') return 'Easy';
  if (lower === 'hard') return 'Hard';
  return 'Medium';
}

// QuestionEditorPage — create or edit a question. Supports per-language
// starter code + a public/hidden test-case builder + (new) examples + hints.
// Hydrates fully from an AI seed (set by QuestionBankPage's "AI Question" button
// or by the in-editor "AI Generate" button below).
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
  const [examples, setExamples] = useState([]);
  const [hints, setHints] = useState([]);
  const [hintsOpen, setHintsOpen] = useState(true);
  const [hintsInput, setHintsInput] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [allowedLanguages, setAllowedLanguages] = useState(['javascript']);

  // AI Generate modal (in-editor). Mirrors the QuestionBankPage modal.
  const [aiOpen, setAiOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('arrays');
  const [aiDifficulty, setAiDifficulty] = useState('Medium');
  const [aiType, setAiType] = useState('coding');
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: '',
      slug: '',
      statement: '',
      difficulty: DIFFICULTY.MEDIUM,
      type: 'coding',
      timeLimitMs: 2000,
      memoryLimitMb: 256,
      constraints: '',
      optimalTime: '',
      optimalSpace: '',
    },
  });

  // Hydrate form for edit OR pre-fill from the AI seed (set by QuestionBank
  // or by the in-editor AI Generate button). The seed shape matches the
  // backend's Question schema, so we hydrate ALL fields here — not just title /
  // statement / difficulty / tags.
  useEffect(() => {
    let active = true;
    (async () => {
      const seedRaw = sessionStorage.getItem('sanchivue:questionSeed');
      if (!isEdit && seedRaw) {
        try {
          const seed = JSON.parse(seedRaw);
          if (active && seed) {
            setValue('title', seed.title || '');
            setValue('slug', seed.slug || '');
            setValue('statement', seed.statement || '');
            setValue('difficulty', seed.difficulty || DIFFICULTY.MEDIUM);
            setValue('constraints', seed.constraints || '');
            setValue('optimalTime', seed.optimalTime || '');
            setValue('optimalSpace', seed.optimalSpace || '');
            setTags(Array.isArray(seed.tags) ? seed.tags : []);
            setExamples(Array.isArray(seed.examples) ? seed.examples : []);
            setHints(Array.isArray(seed.hints) ? seed.hints : []);
            setStarter(seed.starterCode || {});
            setPublicTests(Array.isArray(seed.publicTests) ? seed.publicTests : []);
            setHiddenTests(Array.isArray(seed.hiddenTests) ? seed.hiddenTests : []);
            setAllowedLanguages(
              Array.isArray(seed.allowedLanguages) && seed.allowedLanguages.length
                ? seed.allowedLanguages
                : ['javascript'],
            );
            toast.success('AI question loaded — review and Save when ready.');
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
            setValue('slug', q.slug || '');
            setValue('statement', q.statement || '');
            setValue('difficulty', q.difficulty || DIFFICULTY.MEDIUM);
            setValue('type', q.type || 'coding');
            setValue('timeLimitMs', q.timeLimitMs || 2000);
            setValue('memoryLimitMb', q.memoryLimitMb || 256);
            setValue('constraints', q.constraints || '');
            setValue('optimalTime', q.optimalTime || '');
            setValue('optimalSpace', q.optimalSpace || '');
            setStarter(q.starterCode || {});
            setPublicTests(q.publicTests || []);
            setHiddenTests(q.hiddenTests || []);
            setExamples(q.examples || []);
            setHints(q.hints || []);
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

  const addHint = () => {
    const v = hintsInput.trim();
    if (!v) return;
    setHints([...hints, v]);
    setHintsInput('');
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

  const addExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }]);
  };
  const updateExample = (idx, field, value) => {
    setExamples(examples.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  };
  const removeExample = (idx) => {
    setExamples(examples.filter((_, i) => i !== idx));
  };

  // In-editor AI Generate — calls /questions/ai-generate-question and hydrates
  // the form in place (no navigation). The user reviews + clicks Save to persist.
  const runAiGenerate = async () => {
    setAiLoading(true);
    try {
      const res = await questionApi.aiGenerateQuestion({
        topic: aiTopic,
        difficulty: aiDifficulty,
        type: aiType,
      });
      const question = res?.data?.data?.question;
      if (!question) {
        toast.error('AI did not return a question. Please try again.');
        return;
      }
      // Hydrate the form in place with the AI-generated question. This lets the
      // user review + tweak before saving (per the spec).
      setValue('title', question.title || '');
      setValue('slug', question.slug || '');
      setValue('statement', question.statement || '');
      setValue('difficulty', question.difficulty || DIFFICULTY.MEDIUM);
      setValue('constraints', question.constraints || '');
      setValue('optimalTime', question.optimalTime || '');
      setValue('optimalSpace', question.optimalSpace || '');
      setTags(Array.isArray(question.tags) ? question.tags : []);
      setExamples(Array.isArray(question.examples) ? question.examples : []);
      setHints(Array.isArray(question.hints) ? question.hints : []);
      setStarter(question.starterCode || {});
      setPublicTests(Array.isArray(question.publicTests) ? question.publicTests : []);
      setHiddenTests(Array.isArray(question.hiddenTests) ? question.hiddenTests : []);
      setAllowedLanguages(
        Array.isArray(question.allowedLanguages) && question.allowedLanguages.length
          ? question.allowedLanguages
          : ['javascript'],
      );
      toast.success('AI question loaded — review and Save when ready.');
      setAiOpen(false);
    } catch (err) {
      if (err?.response?.status === 429) {
        toast.error('Too many AI requests — please wait a moment and try again.');
      }
      // other toasts handled by interceptor
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (values) => {
    setSaving(true);
    // Capitalize difficulty to match the backend's DIFFICULTY_VALUES enum.
    const difficulty = capitalizeDifficulty(values.difficulty);
    const payload = {
      ...values,
      difficulty,
      tags,
      allowedLanguages,
      starterCode: starter,
      publicTests,
      hiddenTests,
      examples,
      hints,
      // slug is optional in the form (empty string OK); only send if non-empty.
      slug: values.slug || undefined,
    };
    try {
      if (isEdit) {
        await questionApi.update(id, payload);
        toast.success('Question updated.');
      } else {
        const res = await questionApi.create(payload);
        const newId = res?.data?.data?.id || res?.data?.data?.question?.id;
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => navigate('/questions')}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="flex flex-wrap gap-2">
          {!isEdit && (
            <button
              type="button"
              onClick={() => setAiOpen(true)}
              className="btn-secondary text-sm"
              title="Generate a question with AI in-place"
            >
              <Wand2 className="h-4 w-4 text-brand-indigo" /> AI Generate
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Save changes' : 'Create question'}
          </button>
        </div>
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
        <Input
          label="Slug"
          {...register('slug')}
          error={errors.slug?.message}
          hint="Lowercase + dashes only. Must be unique within the org."
          placeholder="e.g. two-sum"
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
        <div>
          <label className="block text-sm font-medium text-slate-200">Constraints</label>
          <textarea
            {...register('constraints')}
            rows={3}
            className="input-base mt-1.5 resize-y"
            placeholder="e.g. 1 <= nums.length <= 10^4"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Difficulty"
            {...register('difficulty')}
            options={Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label }))}
            error={errors.difficulty?.message}
            placeholder=""
          />
          <Select
            label="Type"
            {...register('type')}
            options={[
              { value: 'coding', label: 'Coding' },
              { value: 'system_design', label: 'System Design' },
              { value: 'behavioral', label: 'Behavioral' },
            ]}
            placeholder=""
          />
          <Input label="Time limit (ms)" type="number" {...register('timeLimitMs')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Memory limit (MB)" type="number" {...register('memoryLimitMb')} />
          <Input
            label="Optimal time"
            {...register('optimalTime')}
            placeholder="e.g. O(N)"
          />
          <Input
            label="Optimal space"
            {...register('optimalSpace')}
            placeholder="e.g. O(1)"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
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

      {/* Examples — visible to candidates. Mirrors the test-case UI but
          rendered separately because examples have a slightly different shape
          (input/output/explanation) and are shown on the problem statement,
          not run by the runner. */}
      <ExamplesSection
        examples={examples}
        onAdd={addExample}
        onUpdate={updateExample}
        onRemove={removeExample}
      />

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

      {/* Hints — collapsible. Visible to candidates (NOT secret). */}
      <div className="card p-5">
        <button
          type="button"
          onClick={() => setHintsOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={hintsOpen}
        >
          <span className="text-sm font-semibold text-slate-100">
            Hints{' '}
            <span className="ml-1 text-xs font-normal text-slate-500">
              ({hints.length} — visible to candidates)
            </span>
          </span>
          {hintsOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>
        {hintsOpen && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={hintsInput}
                onChange={(e) => setHintsInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHint())}
                placeholder="Add a progressive hint + Enter"
                className="input-base flex-1"
              />
              <button type="button" onClick={addHint} className="btn-secondary text-sm">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {hints.length === 0 && (
              <p className="text-xs text-slate-500">
                No hints yet. Add progressive nudges that don&apos;t spoil the answer.
              </p>
            )}
            <ol className="space-y-2">
              {hints.map((h, i) => (
                <li
                  key={`${i}-${h.slice(0, 16)}`}
                  className="flex items-start gap-2 rounded border border-slate-800 bg-slate-950 p-2"
                >
                  <span className="mt-0.5 shrink-0 text-xs font-bold text-brand-indigo">
                    {i + 1}.
                  </span>
                  <span className="flex-1 break-words text-xs text-slate-200">{h}</span>
                  <button
                    type="button"
                    onClick={() => setHints(hints.filter((_, idx) => idx !== i))}
                    className="shrink-0 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                    aria-label={`Remove hint ${i + 1}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

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

      {/* In-editor AI Generate modal — mirrors the QuestionBankPage modal. */}
      <Modal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="AI Generate Question"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setAiOpen(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={runAiGenerate}
              disabled={aiLoading}
              className="btn-primary text-sm"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wand2 className="h-3.5 w-3.5" />
              )}
              Generate question
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-400">
          Pick a topic, difficulty, and type. We&apos;ll generate a complete question — statement,
          starter code, public + hidden tests, hints — and pre-fill this form. Review + tweak,
          then click Save.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select
            label="Topic"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            options={AI_TOPICS}
            placeholder=""
          />
          <Select
            label="Difficulty"
            value={aiDifficulty}
            onChange={(e) => setAiDifficulty(e.target.value)}
            options={AI_DIFFICULTIES}
            placeholder=""
          />
          <Select
            label="Type"
            value={aiType}
            onChange={(e) => setAiType(e.target.value)}
            options={AI_TYPES}
            placeholder=""
          />
        </div>
      </Modal>
    </form>
  );
}

function ExamplesSection({ examples, onAdd, onUpdate, onRemove }) {
  return (
    <div className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Examples</h3>
        <button type="button" onClick={onAdd} className="btn-secondary text-xs">
          <Plus className="h-3.5 w-3.5" /> Add example
        </button>
      </div>
      {examples.length === 0 && (
        <p className="text-xs text-slate-500">No examples yet — these are shown on the problem statement.</p>
      )}
      <ul className="space-y-3">
        {examples.map((t, i) => (
          <li key={i} className="rounded-md border border-slate-800 bg-slate-950 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Example {i + 1}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                aria-label={`Remove example ${i + 1}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">Input</label>
                <textarea
                  value={t.input}
                  onChange={(e) => onUpdate(i, 'input', e.target.value)}
                  rows={2}
                  className="input-base mt-0.5 resize-y font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-slate-500">
                  Output
                </label>
                <textarea
                  value={t.output}
                  onChange={(e) => onUpdate(i, 'output', e.target.value)}
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
