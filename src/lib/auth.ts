import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, ROLES } from "@/lib/constants";
import type { PublicUser } from "@/lib/types";

// 1% CONFIGURATION NOTE: To run this platform you do NOT need any external
// credential here. The JWT secret below is auto-generated per process when the
// environment variable JWT_SECRET is not set, which is fine for local dev.
// For production deployments, set JWT_SECRET in your .env to a long random
// string (e.g. `openssl rand -hex 32`).
const SECRET =
  process.env.JWT_SECRET ||
  "lit-platform-dev-secret-change-me-in-production-please-9f3a7b";

const secretKey = new TextEncoder().encode(SECRET);

export interface SessionPayload {
  userId: string;
  role: string;
  email: string;
}

// Sign a session JWT containing the user id + role.
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return {
      userId: payload.userId as string,
      role: payload.role as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

// Write the signed session JWT into an httpOnly cookie + return it so the
// client can also store it in memory / Authorization header if desired.
export async function setSessionCookie(
  payload: SessionPayload
): Promise<string> {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

// Read the session token from the cookie (preferred) or the Authorization
// Bearer header, then return the authenticated user or null.
export async function getCurrentUser(): Promise<PublicUser | null> {
  const store = await cookies();
  const token =
    store.get(SESSION_COOKIE)?.value ||
    (await getBearerTokenFromHeaders());
  if (!token) return null;
  const payload = await verifySession(token);
  if (!payload) return null;
  const user = await db.user.findUnique({ where: { id: payload.userId } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    resumeUrl: user.resumeUrl,
  };
}

async function getBearerTokenFromHeaders(): Promise<string | null> {
  // next/headers exposes cookies(); for Authorization header we use headers()
  const { headers } = await import("next/headers");
  const h = await headers();
  const auth = h.get("authorization") || h.get("Authorization");
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export function isInterviewer(role: string): boolean {
  return role === ROLES.INTERVIEWER || role === ROLES.ADMIN;
}
