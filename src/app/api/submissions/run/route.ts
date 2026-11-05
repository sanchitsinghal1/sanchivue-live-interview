import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runCode } from "@/lib/code-runner";
import { parseJSON, type TestCase } from "@/lib/types";

// POST /api/submissions/run — execute candidate code against PUBLIC test cases
// only and return a per-case breakdown. Does NOT persist a submission record.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionId = String(body.questionId || "");
    const code = String(body.code || "");
    const language = String(body.language || "javascript");

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
    const result = runCode(
      language,
      code,
      publicTests,
      question.timeLimitMs,
      question.memoryLimitMb
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("[submissions/run]", err);
    return NextResponse.json(
      { error: "Code execution failed." },
      { status: 500 }
    );
  }
}
