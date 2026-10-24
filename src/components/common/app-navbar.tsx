"use client";

import { useEffect, useState } from "react";
import {
  Code2,
  LayoutDashboard,
  Library,
  Sparkles,
  ClipboardList,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isInterviewerRole } from "@/lib/client-constants";

interface NavItem {
  view: "dashboard" | "question-bank" | "jd-builder";
  label: string;
  icon: typeof Code2;
  interviewerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "question-bank", label: "Question Bank", icon: Library },
  {
    view: "jd-builder",
    label: "AI Assessment Builder",
    icon: Sparkles,
    interviewerOnly: true,
  },
];

export function AppNavbar() {
  const { user, view, setView } = useAppStore();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!user) return null;
  const items = NAV_ITEMS.filter(
    (n) => !n.interviewerOnly || isInterviewerRole(user.role)
  );

  const initials = user.name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-white/10 bg-[oklch(0.16_0.02_264)]/80 backdrop-blur-xl transition-shadow",
        scrolled && "shadow-lg shadow-black/20"
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4">
        <button
          onClick={() => setView("dashboard")}
          className="flex items-center gap-2 font-semibold"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-emerald-500">
            <Code2 className="h-4 w-4 text-white" />
          </span>
          <span className="hidden sm:inline text-slate-100">
            Sanchivue
          </span>
        </button>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-thin">
          {items.map((item) => {
            const Icon = item.icon;
            const active = view === item.view;
            return (
              <Button
                key={item.view}
                variant="ghost"
                size="sm"
                onClick={() => setView(item.view)}
                className={cn(
                  "gap-2 text-slate-300 hover:text-white hover:bg-white/5",
                  active && "bg-white/10 text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-white/5 transition-colors">
              <Avatar className="h-7 w-7 border border-white/10">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-emerald-500 text-[10px] font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm text-slate-200">
                {user.name.split(" ")[0]}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-slate-400">{user.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="gap-2 text-slate-400">
              <ClipboardList className="h-4 w-4" />
              Role: {user.role}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2"
              onClick={() => setView("dashboard")}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2 text-rose-400 focus:text-rose-400"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("lit:logout"))
              }
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
