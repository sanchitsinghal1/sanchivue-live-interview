"use client";

import type { ReactNode } from "react";
import { AppNavbar } from "@/components/common/app-navbar";
import { AppFooter } from "@/components/common/app-footer";

// Shared frame for authenticated views: sticky navbar, scrollable main
// content, and a footer pinned to the bottom that pushes down naturally on
// long pages.
export function ViewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[oklch(0.16_0.02_264)] text-slate-200">
      <AppNavbar />
      <main className="flex-1">{children}</main>
      <AppFooter />
    </div>
  );
}
