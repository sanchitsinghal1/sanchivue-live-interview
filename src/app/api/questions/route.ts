import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isInterviewer } from "@/lib/auth";
import { parseJSON, type TestCase, type StarterCode } from "@/lib/types";

// GET /api/questions — list questions with server-side search, difficulty &
// tag filtering, and pagination. Public test cases are returned; hidden tests
// are stripped unless the requester is an interviewer/admin.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || "10")));
  const difficulty = searchParams.get("difficulty") || "";
  const tag = searchParams.get("tag") || "";
  const search = (searchParams.get("search") || "").trim();
  const role = searchParams.get("role") || "";

  const where: Record<string, unknown> = {};
  if (difficulty && ["Easy", "Medium", "Hard"].includes(difficulty)) {
    where.difficulty = difficulty;
  }
  if (tag) {
    // SQLite JSON contains: filter via substring match on the serialized tags.
    where.tags = { contains: `"${tag}"` };
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { statement: { contains: search } },
    ];
  }

  const [total, rows] = await Promise.all([
    db.question.count({ where }),
    db.question.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // If the requester is a candidate (not interviewer/admin), strip hidden tests.
  const stripHidden = role !== "interviewer" && role !== "admin";

  const items = rows.map((q) => {
    const publicTests = parseJSON<TestCase[]>(q.publicTests, []);
    const hiddenTests = stripHidden
      ? []
      : parseJSON<TestCase[]>(q.hiddenTests, []);
    const tags = parseJSON<string[]>(q.tags, []);
    const starterCode = parseJSON<StarterCode>(q.starterCode, {
      javascript: "",
      python: "",
      java: "",
      cpp: "",
    });
    const examples = parseJSON(q.examples, []);
    return {
      id: q.id,
      slug: q.slug,
      title: q.title,
      difficulty: q.difficulty,
      tags,
      statement: q.statement,
      constraints: q.constraints,
      examples,
      optimalTime: q.optimalTime,
      optimalSpace: q.optimalSpace,
      starterCode,
      publicTests,
      hiddenTests,
      timeLimitMs: q.timeLimitMs,
      memoryLimitMb: q.memoryLimitMb,
    };
  });

  return NextResponse.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/questions — create a new question (interviewer/admin only).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isInterviewer(user.role)) {
    return NextResponse.json(
      { error: "Only interviewers can create questions." },
      { status: 403 }
    );
  }
  try {
    const body = await req.json();
    const slug = String(body.slug || "").trim().toLowerCase();
    const title = String(body.title || "").trim();
    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required." },
        { status: 400 }
      );
    }
    const existing = await db.question.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A question with this slug already exists." },
        { status: 409 }
      );
    }
    const question = await db.question.create({
      data: {
        slug,
        title,
        difficulty: body.difficulty || "Medium",
        tags: JSON.stringify(body.tags || []),
        statement: body.statement || "",
        constraints: body.constraints || "",
        examples: JSON.stringify(body.examples || []),
        optimalTime: body.optimalTime || "O(N)",
        optimalSpace: body.optimalSpace || "O(1)",
        starterCode: JSON.stringify(body.starterCode || {}),
        publicTests: JSON.stringify(body.publicTests || []),
        hiddenTests: JSON.stringify(body.hiddenTests || []),
        timeLimitMs: Number(body.timeLimitMs) || 2000,
        memoryLimitMb: Number(body.memoryLimitMb) || 256,
      },
    });
    return NextResponse.json({ id: question.id, slug: question.slug });
  } catch (err) {
    console.error("[questions/create]", err);
    return NextResponse.json(
      { error: "Failed to create question." },
      { status: 500 }
    );
  }
}
