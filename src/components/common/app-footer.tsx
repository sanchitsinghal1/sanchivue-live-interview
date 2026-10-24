"use client";

import { Code2, Github, Heart, Sparkles } from "lucide-react";
import { SanchivueLogo } from "@/components/common/sanchivue-logo";

const CREATOR = "Sanchit Singhal";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[oklch(0.13_0.02_264)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <SanchivueLogo className="h-7 w-7" />
            <p className="mt-3 text-xs text-slate-500">
              Live Technical Interview & AI Assessment Platform
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Built by{" "}
              <span className="font-medium text-slate-300">{CREATOR}</span>
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Product
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>Features</li>
              <li>How it works</li>
              <li>Security</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Company
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li>About {CREATOR}</li>
              <li>Contact</li>
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Connect
            </h4>
            <div className="mt-3 flex items-center gap-3 text-slate-500">
              <a href="https://github.com" target="_blank" rel="noreferrer noopener" aria-label="GitHub" className="hover:text-slate-200">
                <Github className="h-4 w-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn" className="hover:text-slate-200">
                <Sparkles className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            © {new Date().getFullYear()} Sanchivue. Built with
            <Heart className="h-3 w-3 text-rose-400" /> by {CREATOR}.
          </p>
        </div>
      </div>
    </footer>
  );
}
