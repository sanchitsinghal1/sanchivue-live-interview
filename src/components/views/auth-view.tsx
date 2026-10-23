"use client";

import { useState } from "react";
import { Code2, ArrowLeft, Loader2, User, Mail, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEMO_ACCOUNTS } from "@/lib/client-constants";
import type { PublicUser } from "@/lib/client-types";

export function AuthView({ mode }: { mode: "login" | "register" }) {
  const { setUser, setView } = useAppStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"interviewer" | "candidate">("interviewer");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = isRegister
        ? { email, password, name, role }
        : { email, password };
      const res = await api.post<{ user: PublicUser; token?: string }>(
        isRegister ? "/auth" : "/auth/login",
        payload
      );
      setUser(res.user);
      toast.success(
        isRegister
          ? `Welcome, ${res.user.name.split(" ")[0]}!`
          : `Signed in as ${res.user.role}`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(acc: { email: string; password: string }) {
    setEmail(acc.email);
    setPassword(acc.password);
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[oklch(0.16_0.02_264)] px-4 py-10 text-slate-200">
      <div className="absolute inset-0 grid-bg opacity-30" />
      <div className="absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-3xl" />
      <button
        onClick={() => setView("landing")}
        className="absolute left-4 top-4 flex items-center gap-1 text-sm text-slate-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 glow-primary">
            <Code2 className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-2xl font-bold text-white">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isRegister
              ? "Sign up to start running live interviews."
              : "Sign in to enter your interview workspace."}
          </p>
        </div>

        <Card className="border-white/10 bg-[oklch(0.19_0.02_264)]/90 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">
              {isRegister ? "Register" : "Sign in"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {isRegister
                ? "Pick a role — you can switch accounts anytime."
                : "Use a demo account below or your own credentials."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              {isRegister && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Alex Interviewer"
                      className="border-white/10 bg-white/5 pl-9 text-slate-100"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="border-white/10 bg-white/5 pl-9 text-slate-100"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-white/10 bg-white/5 pl-9 pr-9 text-slate-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPw ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div className="space-y-2">
                  <Label>I want to join as</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "interviewer", label: "Interviewer" },
                        { id: "candidate", label: "Candidate" },
                      ] as const
                    ).map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={
                          "rounded-lg border px-3 py-2.5 text-sm transition-colors " +
                          (role === r.id
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")
                        }
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-emerald-500 text-white hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isRegister ? "Creating account…" : "Signing in…"}
                  </>
                ) : isRegister ? (
                  "Create account"
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-sm text-slate-400">
              {isRegister ? "Already have an account?" : "New here?"}{" "}
              <button
                onClick={() => setView(isRegister ? "login" : "register")}
                className="font-medium text-indigo-400 hover:text-indigo-300"
              >
                {isRegister ? "Sign in" : "Create one"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Demo accounts */}
        <div className="mt-5 rounded-xl border border-white/10 bg-[oklch(0.19_0.02_264)]/80 p-4 backdrop-blur-xl">
          <div className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Instant demo accounts
          </div>
          <div className="grid gap-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => fillDemo(acc)}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs transition-colors hover:bg-white/10"
              >
                <div>
                  <div className="font-medium text-slate-200">{acc.role}</div>
                  <div className="text-slate-400">{acc.email}</div>
                </div>
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                >
                  Click to fill
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
