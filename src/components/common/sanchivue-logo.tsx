// Sanchivue brand logo — an original "S" monogram.
// The bold S-curve uses an indigo→emerald gradient; two accent nodes represent
// the interviewer + the candidate collaborating on one problem.

export function SanchivueMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-label="Sanchivue"
      role="img"
    >
      <defs>
        <linearGradient id="svMarkGrad" x1="6" y1="6" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="0.5" stopColor="#6366f1" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="#0b0f1a" />
      <rect x="1" y="1" width="38" height="38" rx="10" stroke="#1e293b" strokeWidth="1" />
      <path
        d="M 27 12 C 27 9 23 8 19 8 C 14 8 12 11 12 14 C 12 17 15 18.5 19 19.5 C 24 20.7 28 22 28 25.5 C 28 30 24 32 19 32 C 14 32 11 30 11 27"
        stroke="url(#svMarkGrad)"
        strokeWidth="5.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="14" r="2.4" fill="#818cf8" />
      <circle cx="28" cy="25.5" r="2.4" fill="#10b981" />
    </svg>
  );
}

export function SanchivueLogo({
  className = "h-8",
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <SanchivueMark className={className} />
      {showWordmark && (
        <span
          className="font-bold tracking-tight text-slate-50"
          style={{ fontSize: "1.15rem", letterSpacing: "-0.025em" }}
        >
          Sanchivue
        </span>
      )}
    </span>
  );
}
