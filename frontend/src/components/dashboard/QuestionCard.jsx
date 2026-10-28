import { Link } from 'react-router-dom';
import { Code2, Bookmark, BookmarkCheck } from 'lucide-react';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../../constants/index.js';
import { truncate } from '../../utils/formatters.js';

// QuestionCard — used in the question bank list.
// Optional `bookmarked` (boolean) controls the icon state; if
// `onToggleBookmark` is supplied, an absolutely-positioned bookmark button is
// rendered in the top-right corner of the card. The button stops propagation
// so the surrounding Link doesn't navigate on click.
export default function QuestionCard({ question, bookmarked = false, onToggleBookmark }) {
  return (
    <Link
      to={`/questions/${question.id}/edit`}
      className="card relative flex h-full flex-col p-4 transition hover:border-slate-700"
    >
      {onToggleBookmark && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleBookmark(question);
          }}
          className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
          aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
          aria-pressed={bookmarked}
        >
          {bookmarked ? (
            <BookmarkCheck className="h-4 w-4 text-amber-300" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className={`badge ${DIFFICULTY_COLORS[question.difficulty]}`}>
          {DIFFICULTY_LABELS[question.difficulty]}
        </span>
        <span className="badge bg-slate-800 text-slate-300">{question.type || 'coding'}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-100">{question.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">
        {truncate(question.statement || '', 140)}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-800 pt-2">
        <Code2 className="h-3 w-3 text-slate-500" />
        {Array.isArray(question.tags) && question.tags.length > 0 ? (
          question.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300"
            >
              {t}
            </span>
          ))
        ) : (
          <span className="text-[10px] text-slate-500">no tags</span>
        )}
      </div>
    </Link>
  );
}
