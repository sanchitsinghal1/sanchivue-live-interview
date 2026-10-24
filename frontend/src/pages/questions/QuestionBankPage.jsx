import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Loader2, Sparkles } from 'lucide-react';
import questionApi from '../../api/question.api.js';
import aiApi from '../../api/ai.api.js';
import QuestionCard from '../../components/dashboard/QuestionCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import {
  DIFFICULTY,
  DIFFICULTY_LABELS,
  DEFAULT_PAGE_SIZE,
} from '../../constants/index.js';
import toast from 'react-hot-toast';

const FILTERS = [
  { value: '', label: 'All' },
  { value: DIFFICULTY.EASY, label: DIFFICULTY_LABELS[DIFFICULTY.EASY] },
  { value: DIFFICULTY.MEDIUM, label: DIFFICULTY_LABELS[DIFFICULTY.MEDIUM] },
  { value: DIFFICULTY.HARD, label: DIFFICULTY_LABELS[DIFFICULTY.HARD] },
];

export default function QuestionBankPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await questionApi.list({
        page,
        limit: DEFAULT_PAGE_SIZE,
        difficulty: difficulty || undefined,
        tag: tag || undefined,
        search: search || undefined,
      });
      const data = res?.data?.data || [];
      setItems(Array.isArray(data) ? data : data?.items || []);
      setTotalPages(res?.data?.pagination?.totalPages || 1);
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, difficulty, tag, search]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const generateQuestion = async () => {
    if (!aiPrompt || aiPrompt.length < 10) {
      toast.error('Describe the question you want in at least 10 chars.');
      return;
    }
    setAiLoading(true);
    try {
      // Use the AI assessment endpoint with a question-shaped prompt.
      const res = await aiApi.assessment({ jd: aiPrompt });
      const data = res?.data?.data || {};
      // Pre-fill the question editor with the AI suggestion.
      const seed = {
        title: data.suggestedTitle || 'AI-generated question',
        statement: data.statement || aiPrompt,
        difficulty: data.difficulty || 'medium',
        tags: data.tags || [],
      };
      // Store in sessionStorage so the editor picks it up.
      sessionStorage.setItem('sanchivue:questionSeed', JSON.stringify(seed));
      toast.success('AI question drafted! Opening the editor…');
      setAiOpen(false);
      setAiPrompt('');
      // Navigate via location change.
      window.location.href = '/questions/new';
    } catch {
      // toast handled by interceptor
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Question Bank</h1>
          <p className="text-sm text-slate-500">Browse, create, or AI-generate interview questions.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAiOpen(true)} className="btn-secondary text-sm">
            <Sparkles className="h-4 w-4 text-brand-indigo" /> AI Generator
          </button>
          <Link to="/questions/new" className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> New Question
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <form onSubmit={onSearch} className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search questions…"
              className="input-base pl-9"
              aria-label="Search questions"
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
              onClick={() => {
                setDifficulty(f.value);
                setPage(1);
              }}
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
        <input
          type="text"
          value={tag}
          onChange={(e) => {
            setTag(e.target.value);
            setPage(1);
          }}
          placeholder="Tag (e.g. arrays)"
          className="input-base w-40"
          aria-label="Filter by tag"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading questions…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No questions yet"
          description="Create your first question or use the AI generator."
          action={
            <Link to="/questions/new" className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> New Question
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost text-sm disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-ghost text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* AI generator modal */}
      <Modal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="AI Question Generator"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setAiOpen(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={generateQuestion}
              disabled={aiLoading}
              className="btn-primary text-sm"
            >
              {aiLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              Generate
            </button>
          </>
        }
      >
        <p className="text-xs text-slate-400">
          Describe the question you want — topic, difficulty, language, focus areas. We&apos;ll
          draft a question and open the editor pre-filled.
        </p>
        <textarea
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          rows={6}
          className="input-base mt-3 resize-y text-sm"
          placeholder="e.g. A medium-difficulty graph question in Python about finding the shortest path in a weighted, directed graph with negative edges (but no negative cycles)…"
        />
      </Modal>
    </div>
  );
}
