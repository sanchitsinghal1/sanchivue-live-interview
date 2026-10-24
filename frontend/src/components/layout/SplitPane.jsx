import { useState, useRef, useEffect } from 'react';

// SplitPane — a small, dependency-free horizontal split-pane.
// Children must be exactly two elements ([left, right]). The drag handle
// adjusts the left pane's flex-basis. We persist the ratio to localStorage.
//
// Responsive behavior: below the `lg` breakpoint we stack the two panes
// vertically (left on top, right below) and hide the drag handle so the room
// is usable on tablets + phones. `lg` and up keeps the original side-by-side
// layout with the resize handle.
export default function SplitPane({
  children,
  storageKey = 'sanchivue:splitpane',
  initialLeft = 60,
  minLeft = 25,
  maxLeft = 80,
  className = '',
}) {
  const [leftPct, setLeftPct] = useState(() => {
    const saved = Number(localStorage.getItem(storageKey));
    return Number.isFinite(saved) && saved >= minLeft && saved <= maxLeft
      ? saved
      : initialLeft;
  });
  const containerRef = useRef(null);
  const draggingRef = useRef(false);

  // Attach window listeners only while dragging so we don't capture clicks
  // elsewhere on the page.
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(maxLeft, Math.max(minLeft, pct));
      setLeftPct(clamped);
    };
    const onUp = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        localStorage.setItem(storageKey, String(leftPct));
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [leftPct, storageKey, minLeft, maxLeft]);

  const onHandleDown = (e) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  };

  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col lg:h-full lg:flex-row ${className}`}
      role="group"
      aria-label="Split pane workspace"
    >
      <div
        style={{ flexBasis: `${leftPct}%` }}
        className="min-h-[60vh] min-w-0 flex-shrink-0 overflow-hidden lg:min-h-0 lg:min-h-full"
      >
        {children[0]}
      </div>
      <div
        onMouseDown={onHandleDown}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panes"
        tabIndex={0}
        className="hidden h-1 shrink-0 cursor-col-resize bg-slate-800 hover:bg-brand-indigo focus:outline-none lg:block lg:w-1 lg:h-full"
      />
      <div
        style={{ flexBasis: `${100 - leftPct}%` }}
        className="min-h-[50vh] min-w-0 flex-1 overflow-hidden lg:min-h-0 lg:min-h-full"
      >
        {children[1]}
      </div>
    </div>
  );
}
