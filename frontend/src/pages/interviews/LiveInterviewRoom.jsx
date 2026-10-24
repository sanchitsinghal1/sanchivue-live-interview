import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Copy,
  Loader2,
  Bot,
  LogOut,
  PenTool,
  Code2,
  MessageSquare,
  ShieldAlert,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import interviewApi from '../../api/interview.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useInterviewRoom } from '../../context/InterviewRoomContext.jsx';
import { useInterview } from '../../hooks/useInterview.js';
import useProctoring from '../../hooks/useProctoring.js';
import CollaborativeEditor from '../../components/interview/CollaborativeEditor.jsx';
import WhiteboardCanvas from '../../components/interview/WhiteboardCanvas.jsx';
import RoomChatBox from '../../components/interview/RoomChatBox.jsx';
import AiCopilotDrawer from '../../components/interview/AiCopilotDrawer.jsx';
import ProctoringAlertFeed from '../../components/interview/ProctoringAlertFeed.jsx';
import RubricScorecard from '../../components/interview/RubricScorecard.jsx';
import VideoCallGrid from '../../components/interview/VideoCallGrid.jsx';
import TestCasePanel from '../../components/interview/TestCasePanel.jsx';
import ParticipantList from '../../components/interview/ParticipantList.jsx';
import InterviewTimer from '../../components/interview/InterviewTimer.jsx';
import SplitPane from '../../components/layout/SplitPane.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import {
  INTERVIEW_STATUS,
} from '../../constants/index.js';
import { formatDateTime } from '../../utils/formatters.js';

// LiveInterviewRoom — the flagship split-pane workspace. Combines collaborative
// editor, video, chat, whiteboard, test cases, AI co-pilot, proctoring, rubric,
// and end-to-end socket presence into one cohesive room.
export default function LiveInterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isInterviewer } = useAuth();
  const { interview, loading, patch } = useInterview(id);
  const { joinRoom, leaveRoom, emit, on, connected } = useInterviewRoom();
  const [participants, setParticipants] = useState([]);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [snapshots, setSnapshots] = useState([]);
  const [activeTab, setActiveTab] = useState('chat'); // chat | proctoring | rubric | whiteboard
  const [leftTab, setLeftTab] = useState('editor'); // editor | whiteboard
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const codeRef = useRef('');

  // Keep codeRef fresh so the AI co-pilot + test panel can read the latest code
  // without re-subscribing on every keystroke.
  codeRef.current = code;

  const roomCode = interview?.roomCode || interview?.id || id;

  // Join the collab room once we have an interview + user.
  useEffect(() => {
    if (interview && user) {
      joinRoom(roomCode, {
        id: user.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }
    return () => leaveRoom();
  }, [interview, user, roomCode, joinRoom, leaveRoom]);

  // Subscribe to presence updates.
  useEffect(() => {
    if (!on) return undefined;
    const off = on('presence:update', (list) => {
      setParticipants(Array.isArray(list) ? list : []);
    });
    return off;
  }, [on]);

  // Auto-flip status → LIVE on first entry by the interviewer / candidate.
  useEffect(() => {
    if (!interview || !user) return;
    if (
      interview.status === INTERVIEW_STATUS.SCHEDULED &&
      (isInterviewer || interview.candidateId === user.id)
    ) {
      patch({ status: INTERVIEW_STATUS.IN_PROGRESS, startedAt: new Date().toISOString() }).catch(
        () => {},
      );
    }
  }, [interview?.status, user?.id, isInterviewer]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed snapshots from the loaded interview.
  useEffect(() => {
    if (interview?.snapshots) {
      setSnapshots(interview.snapshots);
    }
  }, [interview?.snapshots]);

  // Auto-snapshot every 15s.
  useEffect(() => {
    if (!interview) return undefined;
    const t = setInterval(() => {
      const snap = {
        code: codeRef.current,
        language,
        eventType: 'auto',
        timestamp: new Date().toISOString(),
      };
      setSnapshots((prev) => [...prev, snap].slice(-50));
      emit?.('snapshot:save', { roomCode, ...snap });
      interviewApi.saveSnapshot(interview.id, snap).catch(() => {});
    }, 15000);
    return () => clearInterval(t);
  }, [interview, language, emit, roomCode]);

  // Candidate-side proctoring listeners.
  useProctoring({
    interviewId: id,
    userId: user?.id,
    enabled: !!interview && !!user && !isInterviewer,
    emit,
  });

  // Listen for live snapshot:save events (so both sides see the same count).
  useEffect(() => {
    if (!on) return undefined;
    const off = on('snapshot:saved', () => {
      // No-op: we already appended locally.
    });
    return off;
  }, [on]);

  const handleSnapshot = useCallback(
    (snap) => {
      setSnapshots((prev) => [...prev, snap].slice(-50));
      emit?.('snapshot:save', { roomCode, ...snap });
      if (interview) {
        interviewApi.saveSnapshot(interview.id, snap).catch(() => {});
      }
    },
    [emit, interview, roomCode],
  );

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode || '');
    toast.success('Room code copied');
  };

  const handleEnd = async () => {
    try {
      await patch({
        status: INTERVIEW_STATUS.COMPLETED,
        endedAt: new Date().toISOString(),
      });
      toast.success('Interview ended.');
      setEndOpen(false);
      navigate(`/interviews/${id}/report`);
    } catch {
      // toast handled by interceptor
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading interview room…</span>
      </div>
    );
  }

  if (!interview) {
    return (
      <EmptyState
        title="Interview not found"
        description="This interview may have been cancelled, or you may not have access."
        action={
          <Link to="/dashboard" className="btn-secondary text-sm">
            Back to dashboard
          </Link>
        }
      />
    );
  }

  const ended = interview.status === INTERVIEW_STATUS.COMPLETED;
  const question = interview.question || interview.questions?.[0];

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 flex h-[calc(100vh-3.5rem)] flex-col bg-slate-950">
      {/* Toolbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            to="/interviews"
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Back to interviews"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">{interview.title}</p>
            <p className="text-[10px] text-slate-500">
              {interview.jobRole} · {formatDateTime(interview.scheduledAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1 text-xs text-slate-500 sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${connected ? 'bg-brand-emerald' : 'bg-amber-500'}`}
            />
            {connected ? (
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" /> connected
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" /> reconnecting…
              </span>
            )}
          </span>
          <InterviewTimer startedAt={interview.startedAt} endsAt={interview.endsAt} />
          <button
            type="button"
            onClick={copyRoomCode}
            className="hidden items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs text-slate-300 hover:border-slate-600 md:flex"
            title="Copy room code"
          >
            #{roomCode?.slice(0, 8)}
            <Copy className="h-3 w-3" />
          </button>
          <ParticipantList participants={participants} max={4} />
          {isInterviewer && (
            <button
              type="button"
              onClick={() => setCopilotOpen(true)}
              className="btn-ghost text-xs"
              title="Open AI co-pilot"
            >
              <Bot className="h-4 w-4 text-brand-indigo" /> AI
            </button>
          )}
          {isInterviewer && (
            <button
              type="button"
              onClick={() => setEndOpen(true)}
              disabled={ended}
              className="btn-secondary text-xs text-rose-300"
            >
              <LogOut className="h-3.5 w-3.5" /> End
            </button>
          )}
        </div>
      </header>

      {/* Workspace */}
      <div className="flex flex-1 overflow-hidden">
        <SplitPane storageKey="sanchivue:room:split" initialLeft={62} className="flex-1">
          {/* LEFT pane: editor/whiteboard + test panel */}
          <div className="flex h-full flex-col">
            {/* Sub-tabs for editor vs whiteboard */}
            <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-2 py-1">
              <TabButton
                active={leftTab === 'editor'}
                onClick={() => setLeftTab('editor')}
                icon={Code2}
                label="Code"
              />
              <TabButton
                active={leftTab === 'whiteboard'}
                onClick={() => setLeftTab('whiteboard')}
                icon={PenTool}
                label="Whiteboard"
              />
              <div className="ml-auto pr-2">
                {question && (
                  <span className="text-[10px] text-slate-500">
                    Question: {question.title}
                  </span>
                )}
                {snapshots.length > 0 && (
                  <span
                    className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400"
                    title="Code snapshots captured this session"
                  >
                    {snapshots.length} snaps
                  </span>
                )}
              </div>
            </div>

            {/* Problem statement (compact) */}
            {question && (
              <details className="border-b border-slate-800 bg-slate-900/40 px-3 py-2">
                <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                  {question.title}
                </summary>
                <p className="mt-2 whitespace-pre-wrap text-xs text-slate-400">
                  {question.statement}
                </p>
              </details>
            )}

            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-hidden">
                {leftTab === 'editor' ? (
                  <CollaborativeEditor
                    initialCode={interview.initialCode || question?.starterCode?.[language] || ''}
                    initialLanguage={language}
                    on={on}
                    emit={emit}
                    roomCode={roomCode}
                    user={user}
                    onCodeChange={setCode}
                    onLanguageChange={setLanguage}
                  />
                ) : (
                  <WhiteboardCanvas on={on} emit={emit} roomCode={roomCode} />
                )}
              </div>
              <div className="h-72 shrink-0 border-t border-slate-800">
                {question ? (
                  <TestCasePanel
                    question={question}
                    code={codeRef.current}
                    language={language}
                    interviewId={id}
                    hideHiddenTests={!isInterviewer}
                    onSnapshot={handleSnapshot}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-slate-500">
                    No question assigned yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT pane: video + tabs (chat / proctoring / rubric) */}
          <div className="flex h-full flex-col">
            <div className="h-64 shrink-0 border-b border-slate-800">
              <VideoCallGrid
                participants={participants}
                currentUser={user}
                onHangup={() => navigate('/interviews')}
                on={on}
                emit={emit}
                roomCode={roomCode}
              />
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-1 border-b border-slate-800 bg-slate-950 px-2 py-1">
                <TabButton
                  active={activeTab === 'chat'}
                  onClick={() => setActiveTab('chat')}
                  icon={MessageSquare}
                  label="Chat"
                />
                {isInterviewer && (
                  <TabButton
                    active={activeTab === 'proctoring'}
                    onClick={() => setActiveTab('proctoring')}
                    icon={ShieldAlert}
                    label="Proctoring"
                  />
                )}
                {isInterviewer && (
                  <TabButton
                    active={activeTab === 'rubric'}
                    onClick={() => setActiveTab('rubric')}
                    icon={Users}
                    label="Rubric"
                  />
                )}
              </div>
              <div className="flex-1 overflow-hidden bg-slate-950">
                {activeTab === 'chat' && (
                  <RoomChatBox interviewId={id} currentUser={user} on={on} />
                )}
                {activeTab === 'proctoring' && isInterviewer && (
                  <ProctoringAlertFeed
                    initialLogs={interview.proctoringLogs || []}
                    on={on}
                  />
                )}
                {activeTab === 'rubric' && isInterviewer && (
                  <div className="h-full overflow-y-auto p-3">
                    <RubricScorecard
                      interviewId={id}
                      initial={interview.rubricDraft}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </SplitPane>
      </div>

      {/* Already-ended banner */}
      {ended && (
        <div className="border-t border-slate-800 bg-slate-900/60 px-4 py-2 text-center">
          <p className="text-xs text-slate-400">
            This session has ended.{' '}
            <Link to={`/interviews/${id}/report`} className="text-brand-indigo hover:underline">
              View report →
            </Link>
          </p>
        </div>
      )}

      {/* AI Co-Pilot drawer */}
      <AiCopilotDrawer
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        code={codeRef.current}
        questionStatement={question?.statement}
        language={language}
      />

      {/* End-interview confirmation */}
      <Modal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        title="End interview?"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setEndOpen(false)} className="btn-secondary text-sm">
              Cancel
            </button>
            <button type="button" onClick={handleEnd} className="btn-primary text-sm">
              End session
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-300">
          This will mark the interview as <span className="font-medium text-slate-100">ended</span>,
          finalize the rubric, and generate the report. The candidate will be redirected to view
          their report.
        </p>
      </Modal>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition ${
        active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
      }`}
      aria-pressed={active}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
