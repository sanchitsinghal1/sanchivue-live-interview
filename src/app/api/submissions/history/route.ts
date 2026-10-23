import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// GET /api/submissions/history?userId=...&questionId=...
// Returns the candidate's recent submissions (most recent first).
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ items: [] });
  }
  const { searchParams } = new URL(req.url);
  const questionId = searchParams.get("questionId") || undefined;
  // A user may view their own history; interviewers may view any candidate's.
  const targetUserId =
    searchParams.get("userId") || user.id;

  const items = await db.submission.findMany({
    where: {
      userId: targetUserId,
      ...(questionId ? { questionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { question: { select: { title: true, slug: true, difficulty: true } } },
  });

  return NextResponse.json({
    items: items.map((s) => ({
      id: s.id,
      questionId: s.questionId,
      questionTitle: s.question.title,
      questionSlug: s.question.slug,
      difficulty: s.question.difficulty,
      language: s.language,
      status: s.status,
      passedCount: s.passedCount,
      totalCount: s.totalCount,
      score: s.score,
      executionTimeMs: s.executionTimeMs,
      memoryKb: s.memoryKb,
      createdAt: s.createdAt,
    })),
  });
}
