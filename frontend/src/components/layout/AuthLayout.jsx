import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo.jsx';
import CreatorCredit from '../common/CreatorCredit.jsx';

// AuthLayout — a centered split. Left side is a minimal branded panel
// (hidden on small screens): the Sanchivue mark, a single confident tagline,
// and the creator credit. Right side hosts the auth form (Outlet). The panel
// is intentionally quiet so the form is the sole focus.
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
        {/* Subtle grid lines for the developer-IDE aesthetic */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative">
          <BrandLogo className="h-9" />
        </div>
        <div className="relative">
          <h2 className="max-w-sm text-2xl font-semibold leading-tight text-slate-100">
            Run technical interviews that actually predict on-the-job performance.
          </h2>
          <p className="mt-3 max-w-sm text-sm text-slate-400">
            A live workspace built around real code execution, structured
            rubrics, and evidence-rich reports.
          </p>
        </div>
        <div className="relative">
          <CreatorCredit />
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
            <div className="mt-6 text-center lg:hidden">
              <CreatorCredit />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
