// Format helpers used across the app. Pure functions, easy to unit-test.

// --- Date / time ---
export function formatDateTime(value, opts = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    ...opts,
  });
}

export function formatDate(value, opts = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...opts,
  });
}

export function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// "in 3 days", "2 hours ago"
export function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = date.getTime() - Date.now();
  const absDiff = Math.abs(diff);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (absDiff < hour) return rtf.format(Math.round(diff / minute), 'minute');
  if (absDiff < day) return rtf.format(Math.round(diff / hour), 'hour');
  if (absDiff < week) return rtf.format(Math.round(diff / day), 'day');
  if (absDiff < month) return rtf.format(Math.round(diff / week), 'week');
  return rtf.format(Math.round(diff / month), 'month');
}

// Convert ms → "HH:MM:SS" for the live interview timer.
export function formatDurationMs(ms) {
  if (!ms || ms < 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

// "1h 30m" — short form for card metadata.
export function formatMinutes(min) {
  if (!min) return '—';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

// --- Names / avatars ---
export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic color from a string (for participant dots, chat avatars).
export function colorFromString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    'bg-rose-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-brand-indigo',
    'bg-fuchsia-500',
    'bg-cyan-500',
    'bg-orange-500',
  ];
  return palette[Math.abs(hash) % palette.length];
}

// --- Numbers ---
export function formatNumber(n) {
  if (n === null || n === undefined) return '0';
  return new Intl.NumberFormat().format(n);
}

export function formatPercent(n, total) {
  if (!total) return '0%';
  return `${Math.round((n / total) * 100)}%`;
}

// --- Strings ---
export function truncate(str = '', max = 120) {
  if (str.length <= max) return str;
  return `${str.slice(0, max).trimEnd()}…`;
}

export function slugify(str = '') {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
