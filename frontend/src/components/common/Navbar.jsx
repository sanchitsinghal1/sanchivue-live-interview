import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, Bell, LogOut, User as UserIcon, Settings } from 'lucide-react';
import BrandLogo from './BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { BRAND, ROLE_LABELS } from '../../constants/index.js';

const PUBLIC_LINKS = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

// Public Navbar — shown on landing/marketing pages. When authenticated, it
// shows the notifications bell + user menu instead of the login CTA.
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <BrandLogo className="h-8" />
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-sm font-medium text-slate-300 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Get Started
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/settings/notifications"
                className="relative rounded-md border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard" className="btn-secondary">
                Dashboard
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-2 py-1.5 hover:bg-slate-700"
                  aria-label="Open user menu"
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-indigo text-[10px] font-bold text-white">
                    {(user?.name || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-300">{user?.name?.split(' ')[0]}</span>
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-md border border-slate-800 bg-slate-900 py-1 shadow-xl"
                    role="menu"
                  >
                    <div className="border-b border-slate-800 px-3 py-2">
                      <p className="text-sm font-medium text-slate-100">{user?.name}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                      <p className="mt-1 inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {ROLE_LABELS[user?.role] || user?.role}
                      </p>
                    </div>
                    <Link
                      to="/settings/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <UserIcon className="h-4 w-4" /> Profile
                    </Link>
                    <Link
                      to="/settings/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-slate-800"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className="md:hidden rounded p-2 text-slate-300 hover:bg-slate-800"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-slate-800 bg-slate-950 md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3" aria-label="Mobile">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={`rounded-md px-3 py-2 text-sm ${
                  location.pathname === l.to
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-slate-800" />
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings/notifications"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  to="/settings/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Profile &amp; settings
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="rounded-md px-3 py-2 text-left text-sm text-rose-400 hover:bg-slate-800"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary justify-center"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Sticky footer credit is rendered by the public Footer, not here. */}
      <span className="sr-only">{BRAND.name} navigation</span>
      {isAuthenticated && unreadCount > 0 && (
        <span className="sr-only">{unreadCount} unread notifications</span>
      )}
    </header>
  );
}
