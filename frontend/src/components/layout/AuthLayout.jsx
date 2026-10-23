import { Outlet } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo.jsx';
import CreatorCredit from '../common/CreatorCredit.jsx';
import { Link } from 'react-router-dom';
import { BRAND } from '../../constants/index.js';

// AuthLayout: a centered split — left side is a brand panel (hidden on small
// screens), right side hosts the auth form (Outlet). No navbar so the form is
// the sole focus.
export default function AuthLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-950 lg:grid-cols-2">
      {/* Brand panel — hidden on small screens */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 20% 20%, rgba(99,102,241,0.18) 0%, transparent 60%), radial-gradient(50% 40% at 80% 80%, rgba(16,185,129,0.16) 0%, transparent 60%)',
          }}
        />
        <div className="relative">
          <BrandLogo className="h-9" />
          <p className="mt-6 max-w-sm text-lg font-medium text-slate-200">
            {BRAND.tagline}
          </p>
          <p className="mt-3 max-w-sm text-sm text-slate-400">
            Run live coding rounds with a collaborative Monaco editor, AI
            co-pilot, sandboxed execution, anti-cheat proctoring, and instant
            rubric-scored reports.
          </p>
        </div>
        <div className="relative">
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Live IDE with presence cursors</li>
            <li>• AI co-pilot + JD-driven assessment</li>
            <li>• Sandboxed code execution</li>
            <li>• Anti-cheat proctoring + code replay</li>
          </ul>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col">
        <div className="flex items-center justify-between p-4 lg:hidden">
          <BrandLogo className="h-8" />
          <Link to="/" className="btn-ghost text-xs">
            Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Outlet />
            <div className="mt-6 text-center">
              <CreatorCredit />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
