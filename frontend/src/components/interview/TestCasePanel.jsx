import { useState } from 'react';
import { Play, Loader2, CheckCircle2, XCircle, Terminal, Cpu } from 'lucide-react';
import submissionApi from '../../api/submission.api.js';

// TestCasePanel — runs code against a question's test cases. Shows per-case
// results + stdout/stderr tabs. `onSnapshot` lets the parent persist a
// code-snapshot (used by the live room to drive the replay timeline).
export default function TestCasePanel({
  question,
  code,
  language,
  interviewId,
  hideHiddenTests = false,
  onSnapshot,
}) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('cases'); // cases | stdout | stderr

  const publicTests = question?.publicTests || [];
  const hiddenTests = hideHiddenTests ? [] : question?.hiddenTests || [];
  const allTests = [...publicTests, ...hiddenTests];

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await submissionApi.run({
        questionId: question?.id,
        code,
        language,
        interviewId,
      });
      setResults(res?.data?.data || {});
      onSnapshot?.({ code, language, eventType: 'run', timestamp: new Date().toISOString() });
    } catch (err) {
      setError(err?.response?.data?.message || 'Run failed.');
    } finally {
      setRunning(false);
    }
  };

  const submit = async () => {
    setRunning(true);
    setError(null);
    try {
      const res = await submissionApi.submit({
        questionId: question?.id,
        code,
        language,
        interviewId,
      });
      setResults(res?.data?.data || {});
      onSnapshot?.({
        code,
        language,
        eventType: 'submit',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Submit failed.');
    } finally {
      setRunning(false);
    }
  };

  const passed = (results?.cases || []).filter((c) => c.passed).length;
  const total = (results?.cases || []).length;
  const allPass = total > 0 && passed === total;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 p-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={running || !code}
            className="btn-secondary text-xs"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={running || !code}
            className="btn-primary text-xs"
          >
            Submit
          </button>
          {results && total > 0 && (
            <span className={`badge ${allPass ? 'bg-brand-emerald/15 text-brand-emerald' : 'bg-rose-500/15 text-rose-300'}`}>
              {allPass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
              {passed}/{total}
            </span>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setTab('cases')}
            className={`rounded px-2 py-1 text-[11px] ${tab === 'cases' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            Cases
          </button>
          <button
            type="button"
            onClick={() => setTab('stdout')}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${tab === 'stdout' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            <Terminal className="h-3 w-3" /> stdout
          </button>
          <button
            type="button"
            onClick={() => setTab('stderr')}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] ${tab === 'stderr' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            <Terminal className="h-3 w-3" /> stderr
          </button>
        </div>
      </div>
      {error && (
        <p className="border-b border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
      <div className="flex-1 overflow-y-auto p-2 text-xs">
        {tab === 'cases' && (
          <ul className="space-y-1">
            {allTests.length === 0 && (
              <li className="text-slate-500">No test cases defined.</li>
            )}
            {allTests.map((tc, i) => {
              const res = results?.cases?.[i];
              const isHidden = i >= publicTests.length;
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between rounded-md border px-2 py-1.5 ${
                    res?.passed === true
                      ? 'border-brand-emerald/30 bg-brand-emerald/5'
                      : res?.passed === false
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'border-slate-800 bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {res?.passed === true ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-emerald" />
                    ) : res?.passed === false ? (
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <span className="h-3.5 w-3.5 rounded-full border border-slate-600" />
                    )}
                    <span className="text-slate-300">
                      Case {i + 1}
                      {isHidden && !hideHiddenTests && (
                        <span className="ml-1 text-[10px] text-slate-500">(hidden)</span>
                      )}
                    </span>
                  </div>
                  {res && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      {res.execTimeMs && (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" /> {res.execTimeMs}ms
                        </span>
                      )}
                      {res.memoryKb && <span>{Math.round(res.memoryKb / 1024)}KB</span>}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {tab === 'stdout' && (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-slate-300">
            {results?.stdout || '(no output)'}
          </pre>
        )}
        {tab === 'stderr' && (
          <pre className="whitespace-pre-wrap break-words font-mono text-[11px] text-rose-300">
            {results?.stderr || '(no errors)'}
          </pre>
        )}
      </div>
    </div>
  );
}
