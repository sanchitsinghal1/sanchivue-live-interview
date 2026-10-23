"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { fetchCurrentUser, api } from "@/lib/api";
import { LandingView } from "@/components/views/landing-view";
import { AuthView } from "@/components/views/auth-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { QuestionBankView } from "@/components/views/question-bank-view";
import { JdBuilderView } from "@/components/views/jd-builder-view";
import { LiveInterviewRoomView } from "@/components/views/live-interview-room-view";
import { EvaluationReportView } from "@/components/views/evaluation-report-view";
import { AppLoader } from "@/components/common/app-loader";

export default function AppShell() {
  const { user, view, hydrated, setUser, setHydrated, logout } = useAppStore();

  // On first mount, hydrate the auth state from the session cookie.
  useEffect(() => {
    let active = true;
    fetchCurrentUser().then((u) => {
      if (!active) return;
      if (u) setUser(u);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [setUser, setHydrated]);

  // Listen for a custom app-level logout event dispatched from the navbar.
  useEffect(() => {
    const handler = async () => {
      try {
        await api.delete("/auth");
      } catch {
        /* ignore */
      }
      logout();
    };
    window.addEventListener("lit:logout", handler);
    return () => window.removeEventListener("lit:logout", handler);
  }, [logout]);

  if (!hydrated) {
    return <AppLoader />;
  }

  // Unauthenticated views.
  if (!user) {
    if (view === "login" || view === "register") {
      return <AuthView mode={view === "login" ? "login" : "register"} />;
    }
    return <LandingView />;
  }

  // Authenticated views.
  switch (view) {
    case "question-bank":
      return <QuestionBankView />;
    case "jd-builder":
      return <JdBuilderView />;
    case "interview-room":
      return <LiveInterviewRoomView />;
    case "evaluation":
      return <EvaluationReportView />;
    case "dashboard":
    default:
      return <DashboardView />;
  }
}
