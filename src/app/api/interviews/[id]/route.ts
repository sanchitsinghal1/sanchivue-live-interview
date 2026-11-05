import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { INTERVIEW_STATUS } from "@/lib/constants";
import { parseJSON, type ChatMessage, type ProctoringLog, type CodeSnapshot, type RubricScores, emptyRubric } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/interviews/[id] — fetch a single interview session with all its
// nested data (chat, proctoring logs, snapshots, rubric draft).
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const interview = await db.interviewSession.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      interviewer: { select: { id: true, name: true, email: true } },
      question: { select: { id: true, title: true, slug: true, difficulty: true, statement: true, starterCode: true, publicTests: true, hiddenTests: true, timeLimitMs: true, memoryLimitMb: true } },
    },
  });
  if (!interview) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const isParticipant =
    interview.interviewerId === user.id ||
    interview.candidateId === user.id ||
    isInterviewer(user.role);

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // Candidates never receive hidden test cases or proctoring logs.
  const isStaff = isInterviewer(user.role);
  const question = interview.question
    ? {
        ...interview.question,
        starterCode: parseJSON(interview.question.starterCode, {}),
        publicTests: parseJSON(interview.question.publicTests, []),
        hiddenTests: isStaff
          ? parseJSON(interview.question.hiddenTests, [])
          : [],
      }
    : null;

  return NextResponse.json({
    id: interview.id,
    roomCode: interview.roomCode,
    status: interview.status,
    interviewer: interview.interviewer,
    candidate: interview.candidate,
    question,
    chatLog: parseJSON<ChatMessage[]>(interview.chatLog, []),
    proctoringLogs: isStaff
      ? parseJSON<ProctoringLog[]>(interview.proctoringLogs, [])
      : [],
    snapshots: parseJSON<CodeSnapshot[]>(interview.snapshots, []),
    rubricDraft: parseJSON<RubricScores>(interview.rubricDraft, emptyRubric()),
    createdAt: interview.createdAt,
    startedAt: interview.startedAt,
    endedAt: interview.endedAt,
  });
}

// PATCH /api/interviews/[id] — update interview state (start/end session,
// persist chat, proctoring logs, snapshots, rubric draft). Each patch appends
// to the relevant JSON array so nothing is lost.
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const interview = await db.interviewSession.findUnique({ where: { id } });
  if (!interview) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const isParticipant =
    interview.interviewerId === user.id || interview.candidateId === user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.status === INTERVIEW_STATUS.LIVE) {
    data.status = INTERVIEW_STATUS.LIVE;
    if (!interview.startedAt) data.startedAt = new Date();
  }
  if (body.status === INTERVIEW_STATUS.ENDED) {
    data.status = INTERVIEW_STATUS.ENDED;
    data.endedAt = new Date();
  }
  if (typeof body.candidateId === "string" && body.candidateId) {
    data.candidateId = body.candidateId;
  }
  if (typeof body.questionId === "string" && body.questionId) {
    data.questionId = body.questionId;
  }
  if (body.appendChat) {
    const current = parseJSON<ChatMessage[]>(interview.chatLog, []);
    current.push(body.appendChat);
    data.chatLog = JSON.stringify(current.slice(-500));
  }
  if (body.appendProctoring) {
    const current = parseJSON<ProctoringLog[]>(interview.proctoringLogs, []);
    current.push(body.appendProctoring);
    data.proctoringLogs = JSON.stringify(current.slice(-500));
  }
  if (body.appendSnapshot) {
    const current = parseJSON<CodeSnapshot[]>(interview.snapshots, []);
    current.push(body.appendSnapshot);
    data.snapshots = JSON.stringify(current.slice(-300));
  }
  if (body.rubricDraft) {
    data.rubricDraft = JSON.stringify(body.rubricDraft);
  }

  const updated = await db.interviewSession.update({ where: { id }, data });
  return NextResponse.json({ ok: true, status: updated.status });
}
