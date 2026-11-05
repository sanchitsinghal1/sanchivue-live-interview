import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { generateEvaluationSummary } from "@/lib/ai";
import { emptyRubric } from "@/lib/types";
import { parseJSON, type RubricScores, type ProctoringLog } from "@/lib/types";
import { db } from "@/lib/db";

// POST /api/ai/summary — generate an evidence-based AI summary for an interview
// session. Accepts rubric + passedRatio (+ reads proctoring logs from the DB).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isInterviewer(user.role)) {
    return NextResponse.json(
      { error: "Only interviewers can generate summaries." },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const interviewId = String(body.interviewId || "");
    if (!interviewId) {
      return NextResponse.json(
        { error: "interviewId is required." },
        { status: 400 }
      );
    }
    const interview = await db.interviewSession.findUnique({
      where: { id: interviewId },
    });
    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found." },
        { status: 404 }
      );
    }
    const rubric: RubricScores = {
      problemSolving: Number(body.rubricScores?.problemSolving ?? 0),
      cleanCode: Number(body.rubricScores?.cleanCode ?? 0),
      optimization: Number(body.rubricScores?.optimization ?? 0),
      communication: Number(body.rubricScores?.communication ?? 0),
      edgeCases: Number(body.rubricScores?.edgeCases ?? 0),
    };
    const passedRatio = Number(body.passedRatio ?? 0);
    const notes = String(body.interviewerNotes || "");
    const logs = parseJSON<ProctoringLog[]>(interview.proctoringLogs, []);
    const summary = await generateEvaluationSummary(
      rubric,
      logs,
      passedRatio,
      notes
    );
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[ai/summary]", err);
    return NextResponse.json(
      { error: "Summary generation failed." },
      { status: 500 }
    );
  }
}
