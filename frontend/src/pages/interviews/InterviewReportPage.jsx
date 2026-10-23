import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Code2,
  Sparkles,
  Save,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import interviewApi from '../../api/interview.api.js';
import evaluationApi from '../../api/evaluation.api.js';
import aiApi from '../../api/ai.api.js';
import CodeReplayPlayer from '../../components/interview/CodeReplayPlayer.jsx';
import RubricScorecard from '../../components/interview/RubricScorecard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import {
  RUBRIC_CRITERIA,
  RUBRIC_TOTAL_MAX,
} from '../../constants/index.js';
import { formatDateTime, formatDurationMs } from '../../utils/formatters.js';
import { useAuth } from '../../context/AuthContext.jsx';

// InterviewReportPage — rubric scorecard, radar chart, AI evidence summary,
// proctoring log, code-replay timeline, recommendation badge, printable.
export default function InterviewReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInterviewer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ivRes, evRes] = await Promise.all([
          interviewApi.get(id),
          evaluationApi.get(id).catch(() => null),
        ]);
        if (!active) return;
        const iv = ivRes?.data?.data;
        setInterview(iv);
        const ev = evRes?.data?.data;
        setEvaluation(ev || null);
        setNotes(ev?.interviewerNotes || iv?.interviewerNotes || '');
      } catch {
        // toast handled by interceptor
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const rubricScores = evaluation?.rubricScores || interview?.rubricDraft || {};
  const rubricSum = RUBRIC_CRITERIA.reduce((s, c) => s + (rubricScores[c.key] || 0), 0);
  const passedRatio = Math.round((rubricSum / RUBRIC_TOTAL_MAX) * 100);

  const radarData = RUBRIC_CRITERIA.map((c) => ({
    criterion: c.label,
    score: rubricScores[c.key] || 0,
    full: 10,
  }));

  const recommendation =
    passedRatio >= 70 ? 'hire' : passedRatio >= 50 ? 'maybe' : 'no-hire';

  const recommendationBadge = {
    hire: 'bg-brand-emerald/15 text-brand-emerald',
    maybe: 'bg-amber-500/15 text-amber-300',
    'no-hire': 'bg-rose-500/15 text-rose-300',
  }[recommendation];

  const handleSaveEvaluation = async () => {
    setSaving(true);
    try {
      await evaluationApi.create(id, {
        rubricScores: rubricScores,
        interviewerNotes: notes,
        passedRatio,
      });
      toast.success('Evaluation saved.');
    } catch {
      // toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  const generateAiSummary = async () => {
    setAiLoading(true);
    try {
      const res = await aiApi.summary({
        interviewId: id,
        rubricScores,
        interviewerNotes: notes,
        passedRatio,
      });
      const data = res?.data?.data || {};
      setEvaluation((prev) => ({ ...prev, aiSummary: data.summary || data }));
      toast.success('AI summary generated.');
    } catch {
      // toast handled by interceptor
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading report…</span>
      </div>
    );
  }

  if (!interview) {
    return (
      <EmptyState
        title="Report not found"
        description="This interview may not exist, or you may not have access."
        action={
          <Link to="/reports" className="btn-secondary text-sm">
            Back to reports
          </Link>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="no-print flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <button type="button" onClick={() => window.print()} className="btn-secondary text-sm no-print">
          <Printer className="h-4 w-4" /> Print / PDF
        </button>
      </div>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">{interview.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {interview.jobRole} · {interview.candidateEmail || 'Anonymous candidate'}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {formatDateTime(interview.startedAt)} → {formatDateTime(interview.endedAt)}
              {interview.startedAt && interview.endedAt && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDurationMs(
                    new Date(interview.endedAt).getTime() -
                      new Date(interview.startedAt).getTime(),
                  )}
                </span>
              )}
            </p>
          </div>
          <span className={`badge ${recommendationBadge} text-sm`}>
            {recommendation === 'hire' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {recommendation === 'hire'
              ? 'Recommend: Hire'
              : recommendation === 'maybe'
                ? 'Recommend: Maybe'
                : 'Recommend: No Hire'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: rubric + radar + replay + AI summary */}
        <div className="space-y-6 lg:col-span-2">
          {/* Rubric */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-100">Rubric scorecard</h2>
            <div className="mt-4">
              <RubricScorecard
                interviewId={id}
                initial={rubricScores}
                readOnly={!isInterviewer}
              />
            </div>
          </div>

          {/* Radar chart */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-100">Rubric radar</h2>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="criterion" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <defs>
                    <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <Radar
                    dataKey="score"
                    stroke="#6366f1"
                    fill="url(#radarFill)"
                    fillOpacity={0.8}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Code replay */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <Code2 className="h-4 w-4 text-brand-indigo" /> Code replay
            </h2>
            <div className="mt-4">
              <CodeReplayPlayer snapshots={interview.snapshots || []} />
            </div>
          </div>

          {/* AI evidence summary */}
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                <Sparkles className="h-4 w-4 text-brand-indigo" /> AI evidence summary
              </h2>
              {isInterviewer && (
                <button
                  type="button"
                  onClick={generateAiSummary}
                  disabled={aiLoading}
                  className="btn-ghost text-xs"
                >
                  {aiLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {evaluation?.aiSummary ? 'Regenerate' : 'Generate'}
                </button>
              )}
            </div>
            <div className="mt-3">
              {evaluation?.aiSummary ? (
                <div className="space-y-3 text-sm text-slate-300">
                  {typeof evaluation.aiSummary === 'string' ? (
                    <p className="whitespace-pre-wrap">{evaluation.aiSummary}</p>
                  ) : (
                    <>
                      {evaluation.aiSummary.summary && (
                        <p className="whitespace-pre-wrap">{evaluation.aiSummary.summary}</p>
                      )}
                      {Array.isArray(evaluation.aiSummary.strengths) &&
                        evaluation.aiSummary.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-brand-emerald">Strengths</p>
                            <ul className="mt-1 space-y-0.5">
                              {evaluation.aiSummary.strengths.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs">
                                  <CheckCircle2 className="mt-0.5 h-3 w-3 text-brand-emerald" />
                                  <span>{typeof s === 'string' ? s : s.text || JSON.stringify(s)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {Array.isArray(evaluation.aiSummary.concerns) &&
                        evaluation.aiSummary.concerns.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-amber-300">Concerns</p>
                            <ul className="mt-1 space-y-0.5">
                              {evaluation.aiSummary.concerns.map((s, i) => (
                                <li key={i} className="flex items-start gap-1.5 text-xs">
                                  <AlertTriangle className="mt-0.5 h-3 w-3 text-amber-300" />
                                  <span>{typeof s === 'string' ? s : s.text || JSON.stringify(s)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  {isInterviewer
                    ? 'No AI summary yet — click Generate to create one.'
                    : 'The interviewer has not generated an AI summary yet.'}
                </p>
              )}
            </div>
            {isInterviewer && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <label className="block text-xs font-medium text-slate-300">
                  Interviewer notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input-base mt-1.5 resize-y text-sm"
                  placeholder="Write your debrief notes…"
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">passedRatio: {passedRatio}%</span>
                  <button
                    type="button"
                    onClick={handleSaveEvaluation}
                    disabled={saving}
                    className="btn-primary text-xs"
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save evaluation
                  </button>
                </div>
              </div>
            )}
            {!isInterviewer && notes && (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <p className="text-xs font-medium text-slate-300">Interviewer notes</p>
                <p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: proctoring + session meta */}
        <div className="space-y-6">
          {/* Proctoring log */}
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <AlertTriangle className="h-4 w-4 text-amber-400" /> Proctoring log
            </h2>
            {isInterviewer ? (
              (interview.proctoringLogs || []).length === 0 ? (
                <div className="mt-3 rounded-md border border-brand-emerald/30 bg-brand-emerald/5 p-3 text-xs text-brand-emerald">
                  <CheckCircle2 className="inline h-3.5 w-3.5" /> No proctoring alerts.
                </div>
              ) : (
                <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto">
                  {interview.proctoringLogs.map((l, i) => (
                    <li
                      key={l.id || i}
                      className="rounded-md bg-slate-800/50 p-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{l.type}</span>
                        <span className="text-[10px] text-slate-500">
                          {formatDateTime(l.timestamp)}
                        </span>
                      </div>
                      {l.detail && (
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {typeof l.detail === 'string' ? l.detail : JSON.stringify(l.detail)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <p className="mt-3 text-xs text-slate-500">
                Proctoring telemetry is visible to interviewers only.
              </p>
            )}
          </div>

          {/* Session meta */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-100">Session meta</h2>
            <dl className="mt-3 space-y-2 text-xs">
              <MetaRow label="Question">
                {interview.question?.title || interview.questions?.[0]?.title || '—'}
              </MetaRow>
              <MetaRow label="Snapshots">
                {(interview.snapshots || []).length}
              </MetaRow>
              <MetaRow label="Chat messages">
                {(interview.chatMessages || []).length}
              </MetaRow>
              <MetaRow label="Duration">
                {interview.startedAt && interview.endedAt
                  ? formatDurationMs(
                      new Date(interview.endedAt).getTime() -
                        new Date(interview.startedAt).getTime(),
                    )
                  : '—'}
              </MetaRow>
              <MetaRow label="Interviewer">
                {interview.interviewerName || interview.interviewerEmail || '—'}
              </MetaRow>
              <MetaRow label="Room code">
                <span className="font-mono">{interview.roomCode || interview.id}</span>
              </MetaRow>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, children }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">{children}</dd>
    </div>
  );
}
