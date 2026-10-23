import { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  HelpCircle,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Code2,
  Plus,
} from 'lucide-react';
import BrandLogo from '../common/BrandLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { ROLE_LABELS, ROLES } from '../../constants/index.js';
import { getInitials, colorFromString } from '../../utils/formatters.js';

// Sidebar links visible to interviewer/admin (org-side features).
const ORG_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/interviews', label: 'Interviews', icon: Calendar },
  { to: '/questions', label: 'Question Bank', icon: HelpCircle },
  { to: '/candidates', label: 'Candidates', icon: Users },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

// Sidebar links visible to candidates (only their assigned interviews + reports).
const CANDIDATE_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/interviews', label: 'My Interviews', icon: Calendar },
  { to: '/reports', label: 'My Reports', icon: FileBarChart },
];

const SETTINGS_LINKS = [
  { to: '/settings/profile', label: 'Profile', icon: Settings },
];

// DashboardLayout: sidebar + topbar + Outlet. The sidebar collapses on mobile
// to a slide-over drawer. Sticky footer via flex min-h-screen + mt-auto.
export default function DashboardLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links =
    user?.role === ROLES.CANDIDATE ? CANDIDATE_LINKS : ORG_LINKS;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Mobile topbar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded p-1 text-slate-300 hover:bg-slate-800"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <BrandLogo markOnly className="h-7" />
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/settings/notifications"
            className="relative rounded p-1 text-slate-300 hover:bg-slate-800"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-indigo px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded p-1 text-slate-300 hover:bg-slate-800"
            aria-label="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-slate-800 px-4">
            <BrandLogo className="h-7" />
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <SidebarLinks links={links} location={location} />
            {isAuthenticated && (
              <Link
                to="/interviews/new"
                className="mt-2 flex w-full items-center gap-2 rounded-md bg-brand-indigo px-3 py-2 text-sm font-medium text-white hover:bg-brand-indigo-dark"
              >
                <Plus className="h-4 w-4" /> Schedule Interview
              </Link>
            )}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500">
                Settings
              </p>
              <SidebarLinks links={SETTINGS_LINKS} location={location} />
            </div>
          </nav>
          <UserPanel user={user} onLogout={handleLogout} />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/80"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <aside className="absolute left-0 top-0 h-full w-72 border-r border-slate-800 bg-slate-950 p-3">
              <div className="mb-4 flex items-center justify-between">
                <BrandLogo className="h-7" />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded p-1 text-slate-300 hover:bg-slate-800"
                  aria-label="Close sidebar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="overflow-y-auto">
                <SidebarLinks
                  links={links}
                  location={location}
                  onClick={() => setDrawerOpen(false)}
                />
                <div className="mt-4 border-t border-slate-800 pt-3">
                  <SidebarLinks
                    links={SETTINGS_LINKS}
                    location={location}
                    onClick={() => setDrawerOpen(false)}
                  />
                </div>
              </nav>
              <UserPanel user={user} onLogout={handleLogout} className="mt-4" />
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop topbar */}
          <header className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 backdrop-blur lg:flex">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Code2 className="h-4 w-4 text-brand-indigo" />
              <span className="font-mono">sanchivue://{location.pathname}</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/settings/notifications"
                className="relative rounded p-1.5 text-slate-300 hover:bg-slate-800"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-indigo px-1 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/interviews/new" className="btn-primary text-sm">
                <Plus className="h-4 w-4" /> Schedule
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          <footer className="mt-auto border-t border-slate-800 bg-slate-950 px-6 py-4">
            <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
              <span>© {new Date().getFullYear()} Sanchivue. Built by Sanchit Singhal.</span>
              <nav className="flex items-center gap-4">
                <Link to="/about" className="hover:text-slate-300">About</Link>
                <Link to="/contact" className="hover:text-slate-300">Contact</Link>
                <Link to="/privacy" className="hover:text-slate-300">Privacy</Link>
              </nav>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function SidebarLinks({ links, location, onClick }) {
  return (
    <ul className="space-y-1">
      {links.map(({ to, label, icon: Icon }) => {
        const active = location.pathname === to || location.pathname.startsWith(to + '/');
        return (
          <li key={to}>
            <Link
              to={to}
              onClick={onClick}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function UserPanel({ user, onLogout, className = '' }) {
  if (!user) return null;
  const avatarClass = colorFromString(user.email || user.name || '');
  return (
    <div
      className={`border-t border-slate-800 px-3 py-3 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white ${avatarClass}`}
        >
          {getInitials(user.name || user.email || '?')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
          <p className="truncate text-xs text-slate-500">
            {ROLE_LABELS[user.role] || user.role}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
