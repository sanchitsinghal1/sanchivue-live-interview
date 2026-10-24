import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Loader2,
  Copy,
  Pencil,
  Trash2,
  Layers,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import templateApi from '../../api/template.api.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import {
  DIFFICULTY,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  INTERVIEW_TYPE_LABELS,
  LANGUAGE_LABELS,
  DEFAULT_PAGE_SIZE,
} from '../../constants/index.js';
import { formatMinutes } from '../../utils/formatters.js';
import { useOrganization } from '../../context/OrganizationContext.jsx';

const FILTERS = [
  { value: '', label: 'All' },
  { value: DIFFICULTY.EASY, label: DIFFICULTY_LABELS[DIFFICULTY.EASY] },
  { value: DIFFICULTY.MEDIUM, label: DIFFICULTY_LABELS[DIFFICULTY.MEDIUM] },
  { value: DIFFICULTY.HARD, label: DIFFICULTY_LABELS[DIFFICULTY.HARD] },
];

// TemplatesListPage — reusable interview templates (question set + rubric +
// duration + allowed languages). Apply one to a new interview in one click.
export default function TemplatesListPage() {
  const { activeOrg } = useOrganization();
  const orgId = activeOrg?.id || activeOrg?._id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetch = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await templateApi.list({
        orgId,
        difficulty: difficulty || undefined,
        q: search || undefined,
        limit: DEFAULT_PAGE_SIZE * 2,
      });
      const data = res?.data?.data || [];
      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [orgId, difficulty, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const applyTemplate = async (tpl) => {
    // Seed the wizard via sessionStorage — the wizard reads this on mount.
    const seed = {
      templateId: tpl.id,
      title: tpl.name,
      jobRole: tpl.jobRole || '',
      type: tpl.type,
      difficulty: tpl.difficulty,
      durationMinutes: tpl.durationMin,
      allowedLanguages: tpl.allowedLanguages || ['javascript'],
      questionIds: (tpl.questionIds || []).map((q) =>
        typeof q === 'string' ? q : q.id || q._id,
      ),
      rubric: tpl.rubric || {},
    };
    sessionStorage.setItem('sanchivue:templateSeed', JSON.stringify(seed));
    toast.success(`Applied "${tpl.name}" — opening the wizard…`);
    window.location.href = '/interviews/new';
  };

  const duplicateTemplate = (tpl) => {
    const seed = {
      name: `${tpl.name} (copy)`,
      description: tpl.description || '',
      jobRole: tpl.jobRole || '',
      type: tpl.type,
      difficulty: tpl.difficulty,
      durationMin: tpl.durationMin,
      allowedLanguages: tpl.allowedLanguages || ['javascript'],
      questionIds: (tpl.questionIds || []).map((q) =>
        typeof q === 'string' ? q : q.id || q._id,
      ),
      rubric: tpl.rubric || {},
    };
    sessionStorage.setItem('sanchivue:templateEditorSeed', JSON.stringify(seed));
    window.location.href = '/templates/new';
  };

  const confirmDeleteTemplate = async () => {
    if (!confirmDelete) return;
    try {
      await templateApi.delete(confirmDelete.id);
      toast.success('Template deleted.');
      setConfirmDelete(null);
      fetch();
    } catch {
      // toast handled by interceptor
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Interview Templates</h1>
          <p className="text-sm text-slate-500">
            Reusable question sets + rubric + duration — apply one to a new
            interview in a single click.
          </p>
        </div>
        <Link to="/templates/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Template
        </Link>
      </div>

      {!orgId ? (
        <EmptyState
          icon={Layers}
          title="Join or create an organization first"
          description="Templates are scoped to an organization. Create one from Settings → Organization."
        />
      ) : (
        <>
          {/* Filters */}
          <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <form onSubmit={onSearch} className="flex flex-1 items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search templates…"
                  className="input-base pl-9"
                  aria-label="Search templates"
                />
              </div>
              <button type="submit" className="btn-secondary text-sm">
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.value || 'all'}
                  type="button"
                  onClick={() => setDifficulty(f.value)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition ${
                    difficulty === f.value
                      ? 'bg-brand-indigo text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  aria-pressed={difficulty === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex h-40 items-center justify-center text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="ml-2 text-sm">Loading templates…</span>
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No templates yet"
              description="Bundle a question set + rubric + duration into a reusable template so every Senior SWE loop looks the same."
              action={
                <Link to="/templates/new" className="btn-primary text-sm">
                  <Plus className="h-4 w-4" /> New Template
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((tpl) => (
                <TemplateCard
                  key={tpl.id || tpl._id}
                  tpl={tpl}
                  onApply={() => applyTemplate(tpl)}
                  onDuplicate={() => duplicateTemplate(tpl)}
                  onDelete={() => setConfirmDelete(tpl)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete template?"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteTemplate}
              className="btn-primary text-sm"
              style={{ background: '#e11d48' }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          {confirmDelete?.name} will be permanently removed. Existing interviews
          created from this template are unaffected.
        </p>
      </Modal>
    </div>
  );
}

function TemplateCard({ tpl, onApply, onDuplicate, onDelete }) {
  const questions = Array.isArray(tpl.questionIds) ? tpl.questionIds : [];
  return (
    <div className="card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-100">{tpl.name}</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {INTERVIEW_TYPE_LABELS[tpl.type] || tpl.type || 'Coding'}
          </p>
        </div>
        <span className={`badge ${DIFFICULTY_COLORS[tpl.difficulty]}`}>
          {DIFFICULTY_LABELS[tpl.difficulty]}
        </span>
      </div>
      {tpl.description && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-400">{tpl.description}</p>
      )}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Meta label="Duration" value={formatMinutes(tpl.durationMin)} icon={Clock} />
        <Meta
          label="Questions"
          value={`${questions.length} selected`}
          icon={Layers}
        />
      </dl>
      <div className="mt-3 flex flex-wrap gap-1 border-t border-slate-800 pt-3">
        {(tpl.allowedLanguages || []).slice(0, 4).map((l) => (
          <span
            key={l}
            className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
          >
            {LANGUAGE_LABELS[l] || l}
          </span>
        ))}
        {(tpl.allowedLanguages || []).length > 4 && (
          <span className="text-[10px] text-slate-500">
            +{(tpl.allowedLanguages || []).length - 4}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onApply} className="btn-primary text-xs">
          Apply <Plus className="h-3 w-3" />
        </button>
        <Link
          to={`/templates/${tpl.id || tpl._id}/edit`}
          className="btn-secondary text-xs"
        >
          <Pencil className="h-3 w-3" /> Edit
        </Link>
        <button
          type="button"
          onClick={onDuplicate}
          className="btn-ghost text-xs"
          aria-label="Duplicate template"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="btn-ghost text-xs text-rose-400 hover:text-rose-300"
          aria-label="Delete template"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function Meta({ label, value, icon: Icon }) {
  return (
    <div className="rounded bg-slate-950 p-2">
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </dt>
      <dd className="mt-0.5 text-slate-200">{value}</dd>
    </div>
  );
}
