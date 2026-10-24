import { useEffect, useState } from 'react';
import {
  Sparkles,
  Loader2,
  Bug,
  Lightbulb,
  HelpCircle,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import aiApi from '../../api/ai.api.js';
import Modal from '../common/Modal.jsx';

// AiCopilotDrawer — interviewer-only panel. Click "Analyze code" → POST /ai/copilot
// with the current code + question statement. Renders complexity, potential bugs,
// edge cases, follow-up questions, and a hint.
export default function AiCopilotDrawer({ open, onClose, code, questionStatement, language }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await aiApi.copilot({ code, questionStatement, language });
      setResult(res?.data?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'AI analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  // Reset state when drawer opens (so we don't show stale results).
  useEffect(() => {
    if (open) {
      setResult(null);
      setError(null);
    }
  }, [open]);

  const copyText = (text) => {
    navigator.clipboard.writeText(text || '');
    toast.success('Copied to clipboard');
  };

  return (
    <Modal open={open} onClose={onClose} title="AI Co-Pilot" size="lg">
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400">
            Live analysis of the candidate&apos;s current code. For interviewer use only.
          </p>
          <button
            type="button"
            onClick={analyze}
            disabled={loading || !code}
            className="btn-primary shrink-0 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Analyze code
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!result && !loading && !error && (
          <div className="rounded-md border border-dashed border-slate-700 p-6 text-center text-xs text-slate-500">
            Click <span className="text-brand-indigo">Analyze code</span> to get an AI breakdown
            of complexity, bugs, edge cases, follow-ups, and a hint.
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <section>
              <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-brand-indigo" /> Complexity
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {result.complexity && (
                  <span className="badge bg-brand-indigo/15 text-brand-indigo">
                    {result.complexity}
                  </span>
                )}
                {result.timeComplexity && (
                  <span className="badge bg-slate-800 text-slate-300">
                    Time: {result.timeComplexity}
                  </span>
                )}
                {result.spaceComplexity && (
                  <span className="badge bg-slate-800 text-slate-300">
                    Space: {result.spaceComplexity}
                  </span>
                )}
              </div>
            </section>

            {Array.isArray(result.bugs) && result.bugs.length > 0 && (
              <section>
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Bug className="h-3.5 w-3.5 text-rose-400" /> Potential Bugs
                </h4>
                <ul className="space-y-1.5">
                  {result.bugs.map((b, i) => (
                    <li
                      key={i}
                      className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2 text-xs text-slate-300"
                    >
                      {typeof b === 'string' ? b : b.description || JSON.stringify(b)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {Array.isArray(result.edgeCases) && result.edgeCases.length > 0 && (
              <section>
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald" /> Edge Cases
                </h4>
                <ul className="space-y-1">
                  {result.edgeCases.map((e, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-300">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-brand-emerald" />
                      {typeof e === 'string' ? e : e.description || JSON.stringify(e)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {Array.isArray(result.followups) && result.followups.length > 0 && (
              <section>
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-400" /> Follow-up Questions
                </h4>
                <ol className="space-y-1.5">
                  {result.followups.map((q, i) => (
                    <li
                      key={i}
                      className="group flex items-start justify-between gap-2 rounded-md bg-slate-800/50 p-2 text-xs text-slate-200"
                    >
                      <span className="flex gap-1.5">
                        <span className="text-amber-400">{i + 1}.</span>
                        <span>{typeof q === 'string' ? q : q.question || JSON.stringify(q)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(typeof q === 'string' ? q : q.question || JSON.stringify(q))
                        }
                        className="rounded p-1 text-slate-400 opacity-0 hover:bg-slate-700 hover:text-slate-100 group-hover:opacity-100"
                        aria-label="Copy question"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {result.hint && (
              <section>
                <h4 className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" /> Hint
                </h4>
                <p className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2 text-xs text-amber-200">
                  {result.hint}
                </p>
              </section>
            )}

            <button
              type="button"
              onClick={analyze}
              className="btn-secondary text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Re-analyze
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
