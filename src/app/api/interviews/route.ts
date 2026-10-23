import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { INTERVIEW_STATUS } from "@/lib/constants";
import { parseJSON, type ChatMessage, type ProctoringLog, type CodeSnapshot } from "@/lib/types";
import { randomBytes, randomUUID } from "node:crypto";

// POST /api/interviews — interviewer creates a new interview room.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isInterviewer(user.role)) {
    return NextResponse.json(
      { error: "Only interviewers can schedule interviews." },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const candidateEmail = String(body.candidateEmail || "").trim().toLowerCase();
    const questionId = body.questionId ? String(body.questionId) : null;

    let candidateId: string | null = null;
    if (candidateEmail) {
      const candidate = await db.user.findUnique({
        where: { email: candidateEmail },
      });
      candidateId = candidate?.id ?? null;
    }

    // Generate a short, shareable room code.
    const roomCode =
      randomBytes(3).toString("hex").toUpperCase() +
      "-" +
      Math.random().toString(36).slice(2, 6).toUpperCase();

    const interview = await db.interviewSession.create({
      data: {
        roomCode,
        interviewerId: user.id,
        candidateId,
        questionId,
        status: INTERVIEW_STATUS.SCHEDULED,
      },
    });

    return NextResponse.json({
      id: interview.id,
      roomCode: interview.roomCode,
      status: interview.status,
      candidateId: interview.candidateId,
      questionId: interview.questionId,
    });
  } catch (err) {
    console.error("[interviews/create]", err);
    return NextResponse.json(
      { error: "Failed to create interview." },
      { status: 500 }
    );
  }
}

// GET /api/interviews — list interviews for the current user (interviewer sees
// hosted; candidate sees assigned). Optional ?status=LIVE filter.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (isInterviewer(user.role)) {
    where.interviewerId = user.id;
  } else {
    where.candidateId = user.id;
  }
  if (status) where.status = status;

  const items = await db.interviewSession.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      interviewer: { select: { id: true, name: true, email: true } },
      question: { select: { id: true, title: true, slug: true, difficulty: true } },
    },
  });

  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      roomCode: i.roomCode,
      status: i.status,
      candidate: i.candidate,
      interviewer: i.interviewer,
      question: i.question,
      createdAt: i.createdAt,
      startedAt: i.startedAt,
      endedAt: i.endedAt,
    })),
  });
}
