import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { generateEvaluationSummary } from "@/lib/ai";
import { parseJSON, type RubricScores, type ProctoringLog, emptyRubric } from "@/lib/constants-eval";
import { RECOMMENDATION } from "@/lib/constants";

// NOTE: types re-exported from a small local module to avoid a circular import
// edge case with constants. See src/lib/constants-eval.ts.

interface Params {
  params: Promise<{ interviewId: string }>;
}

// GET /api/evaluations/[interviewId] — fetch the evaluation for a session.
export async function GET(_req: NextRequest, { params }: Params) {
  const { interviewId } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const evaluation = await db.evaluation.findUnique({
    where: { interviewId },
  });
  if (!evaluation) {
    return NextResponse.json({ evaluation: null });
  }
  const interview = await db.interviewSession.findUnique({
    where: { id: interviewId },
  });
  // Candidates can only read their own evaluation; interviewers can read all.
  if (
    !isInterviewer(user.role) &&
    interview?.candidateId !== user.id
  ) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  return NextResponse.json({
    evaluation: {
      id: evaluation.id,
      rubricScores: parseJSON<RubricScores>(evaluation.rubricScores, emptyRubric()),
      aiSummary: evaluation.aiSummary,
      interviewerNotes: evaluation.interviewerNotes,
      recommendation: evaluation.recommendation,
      createdAt: evaluation.createdAt,
    },
  });
}

// POST /api/evaluations/[interviewId] — create or update the evaluation, then
// generate the AI evidence summary from the rubric + proctoring logs + notes.
export async function POST(req: NextRequest, { params }: Params) {
  const { interviewId } = await params;
  const user = await getCurrentUser();
  if (!user || !isInterviewer(user.role)) {
    return NextResponse.json(
      { error: "Only interviewers can write evaluations." },
      { status: 403 }
    );
  }
  const interview = await db.interviewSession.findUnique({
    where: { id: interviewId },
  });
  if (!interview) {
    return NextResponse.json({ error: "Interview not found." }, { status: 404 });
  }

  const body = await req.json();
  const rubric: RubricScores = {
    problemSolving: Number(body.rubricScores?.problemSolving ?? 0),
    cleanCode: Number(body.rubricScores?.cleanCode ?? 0),
    optimization: Number(body.rubricScores?.optimization ?? 0),
    communication: Number(body.rubricScores?.communication ?? 0),
    edgeCases: Number(body.rubricScores?.edgeCases ?? 0),
  };
  const notes = String(body.interviewerNotes || "");
  const passedRatio = Number(body.passedRatio ?? 0);
  const logs = parseJSON<ProctoringLog[]>(interview.proctoringLogs, []);

  const summary = await generateEvaluationSummary(rubric, logs, passedRatio, notes);

  const data = {
    rubricScores: JSON.stringify(rubric),
    aiSummary: summary.evidenceSummary,
    interviewerNotes: notes,
    recommendation: summary.recommendation,
    candidateId: interview.candidateId || user.id,
    interviewerId: user.id,
  };

  const evaluation = await db.evaluation.upsert({
    where: { interviewId },
    create: { interviewId, ...data },
    update: data,
  });

  return NextResponse.json({
    evaluation: {
      id: evaluation.id,
      rubricScores: rubric,
      aiSummary: summary.evidenceSummary,
      strengths: summary.strengths,
      concerns: summary.concerns,
      interviewerNotes: notes,
      recommendation: summary.recommendation,
      createdAt: evaluation.createdAt,
    },
  });
}
