import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runCode } from "@/lib/code-runner";
import { getCurrentUser } from "@/lib/auth";
import { parseJSON, type TestCase, type CodeSnapshot } from "@/lib/types";
import { SUBMISSION_STATUS } from "@/lib/constants";

// POST /api/submissions/submit — execute candidate code against BOTH public and
// hidden test cases, persist a Submission record (with code snapshot), and
// return the full breakdown.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to submit." },
        { status: 401 }
      );
    }
    const body = await req.json();
    const questionId = String(body.questionId || "");
    const code = String(body.code || "");
    const language = String(body.language || "javascript");
    const incomingSnapshots = parseJSON<CodeSnapshot[]>(body.snapshots, []);

    if (!questionId || !code) {
      return NextResponse.json(
        { error: "questionId and code are required." },
        { status: 400 }
      );
    }

    const question = await db.question.findUnique({
      where: { id: questionId },
    });
    if (!question) {
      return NextResponse.json({ error: "Question not found." }, { status: 404 });
    }

    const publicTests = parseJSON<TestCase[]>(question.publicTests, []);
    const hiddenTests = parseJSON<TestCase[]>(question.hiddenTests, []);
    const allTests: TestCase[] = [
      ...publicTests.map((t) => ({ ...t, isHidden: false })),
      ...hiddenTests.map((t) => ({ ...t, isHidden: true })),
    ];

    const result = runCode(
      language,
      code,
      allTests,
      question.timeLimitMs,
      question.memoryLimitMb
    );

    // Persist a submission record including a code snapshot for replay.
    const snapshots: CodeSnapshot[] = [
      ...incomingSnapshots,
      {
        timestamp: Date.now(),
        code,
        language,
        eventType: "submit",
      },
    ];

    const submission = await db.submission.create({
      data: {
        userId: user.id,
        questionId,
        code,
        language,
        status: result.overallStatus,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        score: Math.round(
          (result.passedCount / Math.max(1, result.totalCount)) * 100
        ),
        executionTimeMs: result.executionTimeMs,
        memoryKb: result.memoryKb,
        stdout: result.stdout.slice(0, 8000),
        stderr: result.stderr.slice(0, 8000),
        snapshots: JSON.stringify(snapshots),
      },
    });

    return NextResponse.json({
      submissionId: submission.id,
      status: result.overallStatus,
      passedCount: result.passedCount,
      totalCount: result.totalCount,
      results: result.results,
      executionTimeMs: result.executionTimeMs,
      memoryKb: result.memoryKb,
      stdout: result.stdout,
      stderr: result.stderr,
      statusLabel: labelFor(result.overallStatus),
    });
  } catch (err) {
    console.error("[submissions/submit]", err);
    return NextResponse.json(
      { error: "Submission failed." },
      { status: 500 }
    );
  }
}

function labelFor(status: string): string {
  switch (status) {
    case SUBMISSION_STATUS.ACCEPTED:
      return "Accepted";
    case SUBMISSION_STATUS.WRONG_ANSWER:
      return "Wrong Answer";
    case SUBMISSION_STATUS.TLE:
      return "Time Limit Exceeded";
    case SUBMISSION_STATUS.MLE:
      return "Memory Limit Exceeded";
    case SUBMISSION_STATUS.RUNTIME_ERROR:
      return "Runtime Error";
    default:
      return status;
  }
}
