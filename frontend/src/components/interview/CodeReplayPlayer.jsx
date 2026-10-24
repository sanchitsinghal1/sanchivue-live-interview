import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Pause, SkipBack, SkipForward, Code2 } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters.js';

// CodeReplayPlayer — scrub through a list of code snapshots in read-only Monaco.
// Auto-advance at 800ms/frame; step buttons; play/pause.
const FRAME_MS = 800;

export default function CodeReplayPlayer({ snapshots = [] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Reset when snapshots change.
  const [prevKey, setPrevKey] = useState(snapshots);
  if (prevKey !== snapshots) {
    setPrevKey(snapshots);
    setIndex(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return undefined;
    if (index >= snapshots.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setIndex((i) => Math.min(snapshots.length - 1, i + 1)), FRAME_MS);
    return () => clearTimeout(t);
  }, [playing, index, snapshots.length]);

  if (!snapshots.length) {
    return (
      <div className="grid h-48 place-items-center text-center text-xs text-slate-500">
        <div>
          <Code2 className="mx-auto h-6 w-6 text-slate-600" />
          <p className="mt-2">No code snapshots were recorded for this interview.</p>
        </div>
      </div>
    );
  }

  const snap = snapshots[index] || {};
  const eventColors = {
    submit: 'bg-brand-emerald/15 text-brand-emerald',
    run: 'bg-amber-500/15 text-amber-300',
    auto: 'bg-slate-700 text-slate-300',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="grid h-8 w-8 place-items-center rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          aria-label="Previous frame"
        >
          <SkipBack className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          disabled={index >= snapshots.length - 1}
          className="grid h-8 w-8 place-items-center rounded-md bg-brand-indigo text-white hover:bg-brand-indigo-dark disabled:opacity-40"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(snapshots.length - 1, i + 1))}
          disabled={index >= snapshots.length - 1}
          className="grid h-8 w-8 place-items-center rounded-md bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40"
          aria-label="Next frame"
        >
          <SkipForward className="h-4 w-4" />
        </button>
        <div className="ml-2 flex-1">
          <input
            type="range"
            min={0}
            max={snapshots.length - 1}
            value={index}
            onChange={(e) => setIndex(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-800 accent-brand-indigo"
            aria-label="Scrub timeline"
          />
        </div>
        <span className="font-mono text-xs text-slate-400">
          {index + 1}/{snapshots.length}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span
          className={`badge ${
            eventColors[snap.eventType] || 'bg-slate-700 text-slate-300'
          }`}
        >
          {snap.eventType || 'frame'}
        </span>
        <span>{formatDateTime(snap.timestamp)}</span>
      </div>
      <div className="monaco-wrap h-72">
        <Editor
          height="100%"
          theme="vs-dark"
          language={snap.language || 'javascript'}
          value={snap.code || ''}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            automaticLayout: true,
          }}
          loading={<div className="grid h-full place-items-center text-xs text-slate-500">Loading…</div>}
        />
      </div>
    </div>
  );
}
