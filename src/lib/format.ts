// Small formatting helpers used throughout the UI.
export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function formatDateTime(date: Date | string | number): string {
  return new Date(date).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatClockTime(date: Date | string | number): string {
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatMemoryKb(kb: number): string {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "Medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "Hard":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case "ACCEPTED":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "WRONG_ANSWER":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    case "TLE":
    case "MLE":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "RUNTIME_ERROR":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}

export function severityColor(severity: string): string {
  switch (severity) {
    case "high":
      return "text-rose-400 bg-rose-500/10 border-rose-500/40";
    case "medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}

export function recommendationColor(rec: string): string {
  switch (rec) {
    case "STRONG_HIRE":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/40";
    case "HIRE":
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "LEAN_HIRE":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "NO_HIRE":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    default:
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}
