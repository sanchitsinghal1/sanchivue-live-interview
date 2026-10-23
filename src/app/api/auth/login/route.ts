import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
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

// POST /api/auth/login — authenticate with email + password, set session cookie.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await setSessionCookie({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return NextResponse.json({ user: toPublic(user), token });
  } catch (err) {
    console.error("[auth/login]", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
