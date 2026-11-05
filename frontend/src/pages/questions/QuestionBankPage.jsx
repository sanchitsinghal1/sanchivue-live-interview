import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Loader2,
  Sparkles,
  Bookmark,
  Download,
  Upload,
  Wand2,
} from 'lucide-react';
import questionApi from '../../api/question.api.js';
import aiApi from '../../api/ai.api.js';
import bookmarkApi from '../../api/bookmark.api.js';
import { useOrganization } from '../../context/OrganizationContext.jsx';
import QuestionCard from '../../components/dashboard/QuestionCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import Select from '../../components/forms/Select.jsx';
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

// Topic options for the single-question AI generator. Mirrors the local fallback
// bank in backend/src/services/ai.service.js so the local fallback always
// returns a sensible match.
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

export default function QuestionBankPage() {
  const { activeOrg } = useOrganization();
  const orgId = activeOrg?.id;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [difficulty, setDifficulty] = useState('');
  const [tag, setTag] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  // Bookmark state — a Set of question ids the caller has bookmarked. We
  // hydrate it lazily on first list fetch + keep it in sync on every toggle.
  const [bookmarkedIds, setBookmarkedIds] = useState(() => new Set());
  // "Bookmarks" filter toggle — switches the list source between all questions
  // and the caller's bookmarked questions.
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);

  // Existing AI Generator modal (uses /ai/assessment — JD→blueprint flow).
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // New AI Question modal (uses /questions/ai-generate-question — single-question flow).
  const [aiQOpen, setAiQOpen] = useState(false);
  const [aiQTopic, setAiQTopic] = useState('arrays');
  const [aiQDifficulty, setAiQDifficulty] = useState('Medium');
  const [aiQType, setAiQType] = useState('coding');
  const [aiQLoading, setAiQLoading] = useState(false);

  // Import JSON state — hidden file input ref + busy flag.
  const importInputRef = useRef(null);
  const [importing, setImporting] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      if (showBookmarksOnly) {
        // Bookmark list endpoint — returns { items: [{ _id, questionId: {...question} }] }
        // We flatten to the question objects so the existing QuestionCard + grid
        // render without any per-mode branching.
        const res = await bookmarkApi.list({ page, limit: DEFAULT_PAGE_SIZE });
        const data = res?.data?.data;
        const list = Array.isArray(data) ? data : data?.items || [];
        const flat = list
          .map((row) => (row?.questionId ? { ...row.questionId, id: row.questionId._id || row.questionId.id } : null))
          .filter(Boolean);
        setItems(flat);
        setTotalPages(data?.totalPages || 1);
        // Hydrate the bookmarked-set with the ids we just received.
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          flat.forEach((q) => next.add(q.id || q._id));
          return next;
        });
      } else {
        const res = await questionApi.list({
          page,
          limit: DEFAULT_PAGE_SIZE,
          difficulty: difficulty || undefined,
          tag: tag || undefined,
          search: search || undefined,
        });
        const data = res?.data?.data;
        const list = Array.isArray(data) ? data : data?.items || [];
        setItems(list);
        setTotalPages(data?.totalPages || 1);
      }
    } catch {
      // toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, difficulty, tag, search, showBookmarksOnly]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Lazy-hydrate the bookmarked-set on mount so the icon state is correct on
  // the first paint (before the user toggles anything).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await bookmarkApi.list({ page: 1, limit: 100 });
        const data = res?.data?.data;
        const list = Array.isArray(data) ? data : data?.items || [];
        if (!active) return;
        const ids = new Set();
        list.forEach((row) => {
          const id = row?.questionId?._id || row?.questionId?.id || row?.questionId;
          if (typeof id === 'string') ids.add(id);
        });
        setBookmarkedIds(ids);
      } catch {
        // Silently ignore — bookmark icons just start un-filled.
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  // Toggle bookmark on a question — optimistic UI update + rollback on failure.
  const onToggleBookmark = useCallback(
    async (question) => {
      const id = question.id || question._id;
      if (!id) return;
      const wasBookmarked = bookmarkedIds.has(id);
      // Optimistic update.
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (wasBookmarked) next.delete(id);
        else next.add(id);
        return next;
      });
      // If we're in "bookmarks only" mode, also remove the card immediately so
      // the user sees the change without waiting for a refetch.
      if (showBookmarksOnly && wasBookmarked) {
        setItems((prev) => prev.filter((q) => (q.id || q._id) !== id));
      }
      try {
        const res = await bookmarkApi.toggle(id);
        const nowBookmarked = !!res?.data?.data?.bookmarked;
        // Reconcile the optimistic state with the actual server state.
        if (nowBookmarked !== !wasBookmarked) {
          setBookmarkedIds((prev) => {
            const next = new Set(prev);
            if (nowBookmarked) next.add(id);
            else next.delete(id);
            return next;
          });
        }
        toast.success(nowBookmarked ? 'Bookmarked.' : 'Bookmark removed.');
      } catch {
        // Rollback on failure.
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (wasBookmarked) next.add(id);
          else next.delete(id);
          return next;
        });
        // toast handled by interceptor
      }
    },
    [bookmarkedIds, showBookmarksOnly],
  );

  // JD→blueprint AI flow (existing). Calls /ai/assessment with the textarea
  // prompt and stores a minimal seed in sessionStorage before navigating to the
  // editor. Preserved as-is per the "don't break existing behavior" rule.
  const generateQuestion = async () => {
    if (!aiPrompt || aiPrompt.length < 10) {
      toast.error('Describe the question you want in at least 10 chars.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await aiApi.assessment({ jd: aiPrompt });
      const data = res?.data?.data || {};
      const seed = {
        title: data.suggestedTitle || 'AI-generated question',
        statement: data.statement || aiPrompt,
        difficulty: data.difficulty || 'medium',
        tags: data.tags || [],
      };
      sessionStorage.setItem('sanchivue:questionSeed', JSON.stringify(seed));
      toast.success('AI question drafted! Opening the editor…');
      setAiOpen(false);
      setAiPrompt('');
      window.location.href = '/questions/new';
    } catch {
      // toast handled by interceptor
    } finally {
      setAiLoading(false);
    }
  };

  // Single-question AI flow (new). Calls /questions/ai-generate-question with
  // { topic, difficulty, type } and stores the FULL question preview in
  // sessionStorage so the editor hydrates title + statement + slug + examples +
  // starterCode + publicTests + hiddenTests + hints in one go.
  const generateSingleQuestion = async () => {
    if (!aiQTopic) {
      toast.error('Pick a topic first.');
      return;
    }
    setAiQLoading(true);
    try {
      const res = await questionApi.aiGenerateQuestion({
        topic: aiQTopic,
        difficulty: aiQDifficulty,
        type: aiQType,
      });
      const question = res?.data?.data?.question;
      if (!question) {
        toast.error('AI did not return a question. Please try again.');
        return;
      }
      sessionStorage.setItem('sanchivue:questionSeed', JSON.stringify(question));
      toast.success('AI question drafted! Opening the editor…');
      setAiQOpen(false);
      window.location.href = '/questions/new';
    } catch (err) {
      // Friendly rate-limit message — the axios interceptor toasts general
      // errors, but a 429 specifically warrants a calmer "try again shortly".
      if (err?.response?.status === 429) {
        toast.error('Too many AI requests — please wait a moment and try again.');
      }
      // other toasts handled by interceptor
    } finally {
      setAiQLoading(false);
    }
  };

  // Export the org's questions as a JSON file. The backend sets
  // Content-Disposition: attachment, but since we use axios (not a browser
  // navigation), we get the JSON body back and build a Blob to download.
  const onExport = async () => {
    if (!orgId) {
      toast.error('Select an organization first.');
      return;
    }
    try {
      const res = await questionApi.exportJson({ orgId });
      const questions = res?.data?.data?.questions || [];
      const blob = new Blob([JSON.stringify(questions, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanchivue-questions-${orgId.slice(-6)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${questions.length} question(s).`);
    } catch {
      // toast handled by interceptor
    }
  };

  // Import questions from a JSON file picked by the user. Reads the file, parses
  // it, and POSTs { questions } to /questions/import. Shows a toast with the
  // count imported / skipped + any per-entry errors.
  const onImportFile = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        toast.error('That file is not valid JSON.');
        return;
      }
      // Accept either a bare array or { questions: [...] }.
      const questions = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.questions)
          ? parsed.questions
          : null;
      if (!questions) {
        toast.error('JSON must be an array or { questions: [...] }.');
        return;
      }
      const res = await questionApi.importJson({ orgId, questions });
      const result = res?.data?.data || {};
      const imported = result.imported || 0;
      const skipped = result.skipped || 0;
      const errors = Array.isArray(result.errors) ? result.errors : [];
      if (errors.length) {
        toast(
          `Imported ${imported}, skipped ${skipped}, ${errors.length} error(s). First: ${errors[0]?.message || ''}`,
          { icon: '⚠️' },
        );
      } else {
        toast.success(`Imported ${imported} question(s); skipped ${skipped}.`);
      }
      // Refresh the list to show the newly-imported questions.
      setPage(1);
      fetch();
    } catch {
      // toast handled by interceptor
    } finally {
      setImporting(false);
      // Reset the input so the same file can be re-picked.
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Question Bank</h1>
          <p className="text-sm text-slate-500">Browse, create, or AI-generate interview questions.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAiQOpen(true)}
            className="btn-secondary text-sm"
            title="Generate a single question with AI (topic + difficulty + type)"
          >
            <Wand2 className="h-4 w-4 text-brand-indigo" /> AI Question
          </button>
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="btn-secondary text-sm"
            title="Generate an assessment blueprint from a job description"
          >
            <Sparkles className="h-4 w-4 text-brand-indigo" /> AI Generator
          </button>
          <button
            type="button"
            onClick={onExport}
            className="btn-secondary text-sm"
            title="Download the org's questions as a JSON file"
          >
            <Download className="h-4 w-4" /> Export JSON
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="btn-secondary text-sm"
            title="Import questions from a JSON file"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import JSON
          </button>
          <Link to="/questions/new" className="btn-primary text-sm">
            <Plus className="h-4 w-4" /> New Question
          </Link>
        </div>
      </div>

      {/* Hidden file input for the Import JSON flow. */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onImportFile(file);
        }}
      />

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
        {/* Bookmarks toggle — switches the list source between all questions
            and the caller's bookmarked questions. Disabled while no org is
            active so candidates without an org don't see a half-broken toggle. */}
        <button
          type="button"
          onClick={() => {
            setShowBookmarksOnly((v) => !v);
            setPage(1);
          }}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
            showBookmarksOnly
              ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
          aria-pressed={showBookmarksOnly}
          title="Show only your bookmarked questions"
        >
          <Bookmark className={`h-3.5 w-3.5 ${showBookmarksOnly ? 'fill-amber-300' : ''}`} />
          Bookmarks
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Loading questions…</span>
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={showBookmarksOnly ? Bookmark : Plus}
          title={showBookmarksOnly ? 'No bookmarked questions' : 'No questions yet'}
          description={
            showBookmarksOnly
              ? 'Bookmark a question by clicking the bookmark icon on its card.'
              : 'Create your first question or use the AI generator.'
          }
          action={
            <Link to="/questions/new" className="btn-primary text-sm">
              <Plus className="h-4 w-4" /> New Question
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((q) => {
            const id = q.id || q._id;
            return (
              <QuestionCard
                key={id}
                question={q}
                bookmarked={bookmarkedIds.has(id)}
                onToggleBookmark={onToggleBookmark}
              />
            );
          })}
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

      {/* Existing AI generator modal — JD→blueprint flow (preserved). */}
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

      {/* New AI single-question modal — topic + difficulty + type → full question. */}
      <Modal
        open={aiQOpen}
        onClose={() => setAiQOpen(false)}
        title="AI Question Generator"
        size="lg"
        footer={
          <>
            <button type="button" onClick={() => setAiQOpen(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="button"
              onClick={generateSingleQuestion}
              disabled={aiQLoading}
              className="btn-primary text-sm"
            >
              {aiQLoading ? (
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
          starter code, public + hidden tests, hints — and open the editor pre-filled so you can
          review + save. Rate-limited to keep the AI service responsive.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select
            label="Topic"
            value={aiQTopic}
            onChange={(e) => setAiQTopic(e.target.value)}
            options={AI_TOPICS}
            placeholder=""
          />
          <Select
            label="Difficulty"
            value={aiQDifficulty}
            onChange={(e) => setAiQDifficulty(e.target.value)}
            options={AI_DIFFICULTIES}
            placeholder=""
          />
          <Select
            label="Type"
            value={aiQType}
            onChange={(e) => setAiQType(e.target.value)}
            options={AI_TYPES}
            placeholder=""
          />
        </div>
      </Modal>
    </div>
  );
}
