import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJSON, type TestCase, type StarterCode } from "@/lib/types";
import { getCurrentUser, isInterviewer } from "@/lib/auth";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/questions/[id] — fetch a single question. Hidden tests are stripped
// for candidates.
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const role = await (async () => {
    const u = await getCurrentUser();
    return u?.role || "candidate";
  })();
  const question = await db.question.findUnique({ where: { id } });
  if (!question) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const publicTests = parseJSON<TestCase[]>(question.publicTests, []);
  const hiddenTests = isInterviewer(role)
    ? parseJSON<TestCase[]>(question.hiddenTests, [])
    : [];
  return NextResponse.json({
    id: question.id,
    slug: question.slug,
    title: question.title,
    difficulty: question.difficulty,
    tags: parseJSON<string[]>(question.tags, []),
    statement: question.statement,
    constraints: question.constraints,
    examples: parseJSON(question.examples, []),
    optimalTime: question.optimalTime,
    optimalSpace: question.optimalSpace,
    starterCode: parseJSON<StarterCode>(question.starterCode, {
      javascript: "",
      python: "",
      java: "",
      cpp: "",
    }),
    publicTests,
    hiddenTests,
    timeLimitMs: question.timeLimitMs,
    memoryLimitMb: question.memoryLimitMb,
  });
}
