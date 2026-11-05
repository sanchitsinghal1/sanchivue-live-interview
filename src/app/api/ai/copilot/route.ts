import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { analyzeCandidateCode } from "@/lib/ai";

// POST /api/ai/copilot — interviewer-only live AI analysis of candidate code.
// Returns complexity, potential bugs, edge cases, follow-up questions, hint.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isInterviewer(user.role)) {
    return NextResponse.json(
      { error: "AI Co-Pilot is available to interviewers only." },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const code = String(body.code || "");
    const questionStatement = body.questionStatement
      ? String(body.questionStatement)
      : undefined;
    if (!code.trim()) {
      return NextResponse.json(
        { error: "No code provided to analyze." },
        { status: 400 }
      );
    }
    const insight = await analyzeCandidateCode(code, questionStatement);
    return NextResponse.json(insight);
  } catch (err) {
    console.error("[ai/copilot]", err);
    return NextResponse.json(
      { error: "AI analysis failed." },
      { status: 500 }
    );
  }
}
