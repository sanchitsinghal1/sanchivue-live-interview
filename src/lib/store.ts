"use client";

import { create } from "zustand";
import type { PublicUser, AppView } from "@/lib/client-types";

// Global client-side application store. Holds auth state + the current view
// (since this single-page app renders every screen inside the `/` route and
// navigates by switching views rather than routes).
interface AppState {
  user: PublicUser | null;
  view: AppView;
  // Active entity ids used to pass context between views.
  activeQuestionId: string | null;
  activeInterviewId: string | null;
  // Hydration flag so the app shell can render a loader until we know whether
  // the user is authenticated.
  hydrated: boolean;

  setUser: (user: PublicUser | null) => void;
  setView: (view: AppView) => void;
  setActiveQuestionId: (id: string | null) => void;
  setActiveInterviewId: (id: string | null) => void;
  setHydrated: (value: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  view: "landing",
  activeQuestionId: null,
  activeInterviewId: null,
  hydrated: false,

  setUser: (user) =>
    set({
      user,
      // After login/registration, jump to the dashboard.
      view: user ? "dashboard" : "landing",
    }),
  setView: (view) => set({ view }),
  setActiveQuestionId: (id) => set({ activeQuestionId: id }),
  setActiveInterviewId: (id) => set({ activeInterviewId: id }),
  setHydrated: (value) => set({ hydrated: value }),
  logout: () =>
    set({
      user: null,
      view: "landing",
      activeQuestionId: null,
      activeInterviewId: null,
    }),
}));
