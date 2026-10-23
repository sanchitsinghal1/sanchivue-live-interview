import { useEffect, useRef, useState } from 'react';
import WhiteboardToolbar from '../whiteboard/WhiteboardToolbar.jsx';

// WhiteboardCanvas — HTML5 canvas with pen/eraser/line/rect/circle tools.
// Emits `whiteboard:draw` (full stroke) + `whiteboard:clear` via the socket.
// Receives the same events to redraw strokes from remote participants.
//
// Internal canvas is fixed 800×600; CSS scales it to the available space so
// strokes stay crisp regardless of layout size.
const CANVAS_W = 800;
const CANVAS_H = 600;

export default function WhiteboardCanvas({ on, emit, roomCode }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const drawingRef = useRef(false);
  const startRef = useRef(null);
  const snapshotRef = useRef(null); // for shape preview

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ffffff');
  const strokesRef = useRef([]);
  const [canUndo, setCanUndo] = useState(strokesRef.current.length > 0);

  // Init context.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
  }, []);

  // Listen for remote draw + clear events.
  useEffect(() => {
    if (!on) return undefined;
    const offDraw = on('whiteboard:draw', (stroke) => {
      drawStroke(ctxRef.current, stroke);
      strokesRef.current.push(stroke);
      setCanUndo(strokesRef.current.length > 0);
    });
    const offClear = on('whiteboard:clear', () => {
      clearCanvas();
    });
    return () => {
      offDraw?.();
      offClear?.();
    };
  }, [on]);

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    strokesRef.current = [];
    setCanUndo(false);
  };

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onDown = (e) => {
    drawingRef.current = true;
    const p = pos(e);
    startRef.current = p;
    if (tool === 'pen' || tool === 'eraser') {
      const ctx = ctxRef.current;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    } else {
      // Snapshot for shape preview (so dragging re-renders cleanly).
      snapshotRef.current = ctxRef.current.getImageData(0, 0, CANVAS_W, CANVAS_H);
    }
  };

  const onMove = (e) => {
    if (!drawingRef.current) return;
    const p = pos(e);
    const ctx = ctxRef.current;
    if (tool === 'pen' || tool === 'eraser') {
      ctx.strokeStyle = tool === 'eraser' ? '#020617' : color;
      ctx.lineWidth = tool === 'eraser' ? 16 : 2;
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    } else {
      // Restore snapshot then preview shape.
      ctx.putImageData(snapshotRef.current, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (tool === 'line') {
        ctx.moveTo(startRef.current.x, startRef.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(
          startRef.current.x,
          startRef.current.y,
          p.x - startRef.current.x,
          p.y - startRef.current.y,
        );
      } else if (tool === 'circle') {
        const r = Math.hypot(p.x - startRef.current.x, p.y - startRef.current.y);
        ctx.arc(startRef.current.x, startRef.current.y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const onUp = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const p = pos(e);
    const stroke = {
      tool,
      color,
      from: startRef.current,
      to: p,
      roomCode,
    };
    strokesRef.current.push(stroke);
    setCanUndo(true);
    emit?.('whiteboard:draw', stroke);
  };

  const handleUndo = () => {
    strokesRef.current.pop();
    setCanUndo(strokesRef.current.length > 0);
    const ctx = ctxRef.current;
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    strokesRef.current.forEach((s) => drawStroke(ctx, s));
  };

  const handleClear = () => {
    clearCanvas();
    emit?.('whiteboard:clear', { roomCode });
  };

  return (
    <div className="flex h-full flex-col">
      <WhiteboardToolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        onClear={handleClear}
        onUndo={handleUndo}
        canUndo={canUndo}
      />
      <div className="relative flex-1 bg-slate-950">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          className="h-full w-full touch-none"
          style={{ aspectRatio: `${CANVAS_W}/${CANVAS_H}` }}
          aria-label="Shared whiteboard"
        />
      </div>
    </div>
  );
}

function drawStroke(ctx, stroke) {
  if (!ctx || !stroke) return;
  ctx.save();
  ctx.strokeStyle = stroke.tool === 'eraser' ? '#020617' : stroke.color || '#ffffff';
  ctx.lineWidth = stroke.tool === 'eraser' ? 16 : 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (stroke.tool === 'pen' || stroke.tool === 'eraser') {
    ctx.beginPath();
    ctx.moveTo(stroke.from.x, stroke.from.y);
    ctx.lineTo(stroke.to.x, stroke.to.y);
    ctx.stroke();
  } else if (stroke.tool === 'line') {
    ctx.beginPath();
    ctx.moveTo(stroke.from.x, stroke.from.y);
    ctx.lineTo(stroke.to.x, stroke.to.y);
    ctx.stroke();
  } else if (stroke.tool === 'rect') {
    ctx.strokeRect(
      stroke.from.x,
      stroke.from.y,
      stroke.to.x - stroke.from.x,
      stroke.to.y - stroke.from.y,
    );
  } else if (stroke.tool === 'circle') {
    const r = Math.hypot(stroke.to.x - stroke.from.x, stroke.to.y - stroke.from.y);
    ctx.beginPath();
    ctx.arc(stroke.from.x, stroke.from.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
