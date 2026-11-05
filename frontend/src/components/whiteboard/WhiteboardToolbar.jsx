// WhiteboardToolbar — controls passed down to WhiteboardCanvas.
// Stateless by itself: caller owns the active tool/color/etc. and just renders
// these as buttons.
export default function WhiteboardToolbar({
  tool,
  setTool,
  color,
  setColor,
  onClear,
  onUndo,
  canUndo = false,
}) {
  const colors = ['#ffffff', '#6366f1', '#10b981', '#f59e0b', '#f43f5e'];
  const tools = [
    { id: 'pen', label: 'Pen' },
    { id: 'eraser', label: 'Eraser' },
    { id: 'line', label: 'Line' },
    { id: 'rect', label: 'Rect' },
    { id: 'circle', label: 'Circle' },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
      <div className="flex items-center gap-1">
        {tools.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={`rounded px-2 py-1 text-xs font-medium transition ${
              tool === t.id
                ? 'bg-brand-indigo text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            aria-pressed={tool === t.id}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="h-4 w-px bg-slate-700" />
      <div className="flex items-center gap-1">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full border-2 transition ${
              color === c ? 'border-white' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Pick color ${c}`}
          />
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onClear}
          className="rounded bg-rose-500/15 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/25"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
