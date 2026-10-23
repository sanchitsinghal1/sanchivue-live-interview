import { useState } from 'react';
import { RUBRIC_CRITERIA, RUBRIC_MAX, RUBRIC_TOTAL_MAX } from '../../constants/index.js';
import interviewApi from '../../api/interview.api.js';
import toast from 'react-hot-toast';

// RubricScorecard — interactive sliders per criterion. On change, we PATCH
// `/interviews/:id` with the updated `rubricDraft` (debounced in the parent).
// Caller passes `interviewId` + initial `rubricScores`.
export default function RubricScorecard({ interviewId, initial = {}, readOnly = false }) {
  const [scores, setScores] = useState(() => {
    const seed = {};
    RUBRIC_CRITERIA.forEach((c) => {
      seed[c.key] = initial?.[c.key] ?? 5;
    });
    return seed;
  });
  const [saving, setSaving] = useState(false);

  const total = RUBRIC_CRITERIA.reduce((sum, c) => sum + (scores[c.key] || 0), 0);

  const onChange = (key, value) => {
    const next = { ...scores, [key]: Number(value) };
    setScores(next);
    if (readOnly) return;
    // Persist with a tiny debounce — avoids spamming the API while dragging.
    setSaving(true);
    clearTimeout(window.__rubricSaveTimer);
    window.__rubricSaveTimer = setTimeout(async () => {
      try {
        await interviewApi.update(interviewId, { rubricDraft: next });
      } catch {
        toast.error('Failed to save rubric scores.');
      } finally {
        setSaving(false);
      }
    }, 400);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Rubric Scorecard
        </h4>
        <span className="flex items-center gap-2 text-xs text-slate-300">
          {saving && (
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" aria-hidden="true" />
          )}
          <span className="font-mono">
            {total}/{RUBRIC_TOTAL_MAX}
          </span>
        </span>
      </div>
      <ul className="space-y-3">
        {RUBRIC_CRITERIA.map((c) => (
          <li key={c.key}>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="font-medium text-slate-200">{c.label}</p>
                <p className="text-[11px] text-slate-500">{c.description}</p>
              </div>
              <span className="font-mono text-slate-300">
                {scores[c.key] ?? 0}/{RUBRIC_MAX}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={RUBRIC_MAX}
              step={1}
              value={scores[c.key] ?? 0}
              onChange={(e) => onChange(c.key, e.target.value)}
              disabled={readOnly}
              className="mt-1 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-brand-indigo"
              aria-label={`${c.label} score`}
            />
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
        <span className="text-slate-400">Recommendation</span>
        <span
          className={`badge ${
            total / RUBRIC_TOTAL_MAX >= 0.7
              ? 'bg-brand-emerald/15 text-brand-emerald'
              : total / RUBRIC_TOTAL_MAX >= 0.5
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-rose-500/15 text-rose-300'
          }`}
        >
          {total / RUBRIC_TOTAL_MAX >= 0.7
            ? 'Hire'
            : total / RUBRIC_TOTAL_MAX >= 0.5
              ? 'Maybe'
              : 'No hire'}
        </span>
      </div>
    </div>
  );
}
