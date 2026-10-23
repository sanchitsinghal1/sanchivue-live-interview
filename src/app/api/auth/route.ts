import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie, clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import type { PublicUser } from "@/lib/types";

function toPublic(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  resumeUrl: string | null;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    resumeUrl: user.resumeUrl,
  };
}

// POST /api/auth/register — create a new user, set session cookie, return user.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const role = String(body.role || ROLES.CANDIDATE);

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required." },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
    if (![ROLES.CANDIDATE, ROLES.INTERVIEWER, ROLES.ADMIN].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 10);
    const user = await db.user.create({
      data: { email, password: hashed, name, role },
    });

    const token = await setSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({ user: toPublic(user), token });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}

// GET /api/auth/me — return the currently authenticated user.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user });
}

// DELETE /api/auth — clear the session cookie (logout).
export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
