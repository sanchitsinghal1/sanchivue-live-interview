import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { generateAssessmentFromJD } from "@/lib/ai";

// POST /api/ai/assessment — interviewer-only JD-to-assessment blueprint.
// Returns recommended topics, 3 tailored coding problems with test cases, and
// rubric weights. Works offline via the deterministic fallback analyzer.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isInterviewer(user.role)) {
    return NextResponse.json(
      { error: "Only interviewers can generate assessments." },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const jd = String(body.jd || "");
    if (!jd.trim()) {
      return NextResponse.json(
        { error: "Please paste a job description first." },
        { status: 400 }
      );
    }
    const blueprint = await generateAssessmentFromJD(jd);
    return NextResponse.json(blueprint);
  } catch (err) {
    console.error("[ai/assessment]", err);
    return NextResponse.json(
      { error: "Assessment generation failed." },
      { status: 500 }
    );
  }
}
