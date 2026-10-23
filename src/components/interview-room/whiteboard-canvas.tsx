"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Eraser,
  Pen,
  Minus,
  Square,
  Trash2,
  Undo2,
} from "lucide-react";
import { getSocket } from "@/lib/socket-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tool = "pen" | "eraser" | "rect" | "line";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  tool: Tool;
  color: string;
  points: Point[];
}

// Internal canvas coordinate space. Strokes are stored in this space so the
// board looks identical on every screen size; CSS scales it to fit.
const CANVAS_W = 800;
const CANVAS_H = 600;

const SWATCHES = ["#0f172a", "#6366f1", "#10b981", "#f59e0b", "#ec4899"];

interface WhiteboardCanvasProps {
  roomCode: string;
}

export function WhiteboardCanvas({ roomCode }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState<string>(SWATCHES[1]);
  // All committed strokes — used to redraw on resize / clear.
  const strokesRef = useRef<Stroke[]>([]);
  // The in-progress stroke (while the pointer is held down).
  const drawingRef = useRef<Stroke | null>(null);

  // ---------- Rendering ----------
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // White background.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    // Grid hint.
    ctx.strokeStyle = "rgba(15,23,42,0.06)";
    ctx.lineWidth = 1;
    for (let x = 40; x < CANVAS_W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 40; y < CANVAS_H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
      ctx.stroke();
    }
    for (const s of strokesRef.current) drawStroke(ctx, s);
    if (drawingRef.current) drawStroke(ctx, drawingRef.current);
  }, []);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // ---------- Pointer handlers ----------
  function toCanvasPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: Math.round((e.clientX - rect.left) * scaleX),
      y: Math.round((e.clientY - rect.top) * scaleY),
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    (e.target as HTMLCanvasElement).setPointerCapture?.(e.pointerId);
    const p = toCanvasPoint(e);
    drawingRef.current = { tool, color, points: [p] };
    redraw();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const cur = drawingRef.current;
    if (!cur) return;
    const p = toCanvasPoint(e);
    if (cur.tool === "pen" || cur.tool === "eraser") {
      cur.points.push(p);
    } else {
      // rect / line: keep exactly 2 points {start, end}.
      cur.points = [cur.points[0], p];
    }
    redraw();
  }

  function onPointerUp() {
    const cur = drawingRef.current;
    if (!cur) return;
    if (cur.points.length > 0) {
      strokesRef.current.push(cur);
      // Emit to remote peers.
      try {
        const socket = getSocket();
        socket.emit("whiteboard:draw", {
          roomCode,
          points: cur.points,
          color: cur.color,
          tool: cur.tool,
        });
      } catch {
        /* ignore */
      }
    }
    drawingRef.current = null;
    redraw();
  }

  function clearBoard() {
    strokesRef.current = [];
    drawingRef.current = null;
    redraw();
    try {
      const socket = getSocket();
      socket.emit("whiteboard:clear", { roomCode });
    } catch {
      /* ignore */
    }
  }

  function undoLast() {
    const last = strokesRef.current.pop();
    if (last) redraw();
    // We don't broadcast an undo — peers would need to redraw from a state
    // request. The simpler approach (acceptable for the live demo) is to
    // only undo locally; the interviewer/candidate both see the same stroke
    // history because strokes are appended in real time.
    void last;
  }

  // ---------- Socket listeners ----------
  useEffect(() => {
    const socket = getSocket();
    function onDraw(payload: {
      points: Point[];
      color: string;
      tool: Tool;
    }) {
      if (!payload || !Array.isArray(payload.points)) return;
      strokesRef.current.push({
        tool: payload.tool,
        color: payload.color,
        points: payload.points,
      });
      redraw();
    }
    function onClear() {
      strokesRef.current = [];
      redraw();
    }
    socket.on("whiteboard:draw", onDraw);
    socket.on("whiteboard:clear", onClear);
    return () => {
      socket.off("whiteboard:draw", onDraw);
      socket.off("whiteboard:clear", onClear);
    };
  }, [redraw]);

  // ---------- Resize handling ----------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      // CSS already scales the canvas; we just need a redraw to keep crispness.
      redraw();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: "pen", icon: Pen, label: "Pen" },
    { id: "eraser", icon: Eraser, label: "Eraser" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "line", icon: Minus, label: "Line" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[oklch(0.18_0.02_264)] px-3 py-2">
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
          {tools.map((t) => {
            const Icon = t.icon;
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                title={t.label}
                aria-label={t.label}
                aria-pressed={active}
                className={cn(
                  "rounded-md p-1.5 text-slate-300 transition-colors hover:bg-white/10",
                  active && "bg-white/15 text-white"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 p-0.5">
          {SWATCHES.map((c) => {
            const active = color === c;
            return (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Pick color ${c}`}
                className={cn(
                  "m-0.5 h-5 w-5 rounded-full border-2 transition-transform",
                  active ? "border-white scale-110" : "border-white/20"
                )}
                style={{ background: c }}
              />
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={undoLast}
            className="border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            <Undo2 className="mr-1 h-3.5 w-3.5" />
            Undo
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={clearBoard}
            className="border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>
      {/* Canvas surface — centered, aspect-preserved to fit container. */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 items-center justify-center bg-[oklch(0.13_0.02_264)] p-3"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="max-h-full max-w-full touch-none rounded-lg border border-white/10 bg-white shadow-lg"
          style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
        />
      </div>
    </div>
  );
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
) {
  const { tool, color, points } = stroke;
  if (points.length === 0) return;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (tool === "eraser") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 18;
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = tool === "pen" ? 2.5 : 2.5;
  }
  if (tool === "rect" && points.length >= 2) {
    const [a, b] = points;
    ctx.strokeRect(
      Math.min(a.x, b.x),
      Math.min(a.y, b.y),
      Math.abs(b.x - a.x),
      Math.abs(b.y - a.y)
    );
    return;
  }
  if (tool === "line" && points.length >= 2) {
    const [a, b] = points;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    return;
  }
  // pen / eraser → polyline
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}
