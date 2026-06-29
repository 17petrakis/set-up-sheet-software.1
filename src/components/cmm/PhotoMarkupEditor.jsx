import React, { useRef, useState, useEffect, useCallback } from "react";
import { X, Circle, ArrowRight, Minus, Pencil, RotateCcw, Check, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const TOOLS = [
  { id: "arrow", label: "Arrow", Icon: ArrowRight },
  { id: "circle", label: "Circle", Icon: Circle },
  { id: "line", label: "Line", Icon: Minus },
  { id: "freehand", label: "Draw", Icon: Pencil },
];

function drawShape(ctx, shape) {
  ctx.strokeStyle = shape.color || "#ef4444";
  ctx.lineWidth = shape.lineWidth || 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (shape.type === "arrow") {
    const dx = shape.x2 - shape.x1;
    const dy = shape.y2 - shape.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const angle = Math.atan2(dy, dx);
    const headLen = Math.min(20, len * 0.4);
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(shape.x2 - headLen * Math.cos(angle - Math.PI / 6), shape.y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(shape.x2, shape.y2);
    ctx.lineTo(shape.x2 - headLen * Math.cos(angle + Math.PI / 6), shape.y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  } else if (shape.type === "circle") {
    const rx = Math.abs(shape.x2 - shape.x1) / 2;
    const ry = Math.abs(shape.y2 - shape.y1) / 2;
    const cx = (shape.x1 + shape.x2) / 2;
    const cy = (shape.y1 + shape.y2) / 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx || 1, ry || 1, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (shape.type === "line") {
    ctx.beginPath();
    ctx.moveTo(shape.x1, shape.y1);
    ctx.lineTo(shape.x2, shape.y2);
    ctx.stroke();
  } else if (shape.type === "freehand" && shape.points?.length > 1) {
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    for (let i = 1; i < shape.points.length; i++) {
      ctx.lineTo(shape.points[i].x, shape.points[i].y);
    }
    ctx.stroke();
  }
}

export default function PhotoMarkupEditor({ photoUrl, onSave, onClose }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [tool, setTool] = useState("arrow");
  const [shapes, setShapes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [current, setCurrent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);

  const COLOR = "#ef4444";

  const redraw = useCallback((extraShape = null) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imgLoaded) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    [...shapes, ...(extraShape ? [extraShape] : [])].forEach(s => drawShape(ctx, s));
  }, [shapes, imgLoaded]);

  useEffect(() => { redraw(); }, [redraw]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    setDrawing(true);
    if (tool === "freehand") {
      setCurrent({ type: "freehand", color: COLOR, lineWidth: lineWidth, points: [pos] });
    } else {
      setCurrent({ type: tool, color: COLOR, lineWidth: lineWidth, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    }
  };

  const onMouseMove = (e) => {
    e.preventDefault();
    if (!drawing || !current) return;
    const pos = getPos(e);
    let updated;
    if (tool === "freehand") {
      updated = { ...current, points: [...current.points, pos] };
    } else {
      updated = { ...current, x2: pos.x, y2: pos.y };
    }
    setCurrent(updated);
    redraw(updated);
  };

  const onMouseUp = (e) => {
    e.preventDefault();
    if (!drawing || !current) return;
    setShapes(prev => [...prev, current]);
    setCurrent(null);
    setDrawing(false);
  };

  const undo = () => setShapes(prev => prev.slice(0, -1));
  const clear = () => setShapes([]);

  const handleSave = async () => {
    setSaving(true);
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "markup.png", { type: "image/png" });
      const result = await base44.integrations.Core.UploadFile({ file });
      onSave(result.file_url);
      setSaving(false);
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95" onClick={e => e.stopPropagation()}>
      {/* Header toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-black/80 border-b border-white/10 shrink-0 flex-wrap">
        <span className="text-white text-sm font-semibold mr-2">Markup</span>

        {/* Tool buttons */}
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
          {TOOLS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTool(id)}
              title={label}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tool === id ? "bg-red-500 text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-2.5 py-1">
          <span className="text-white/50 text-[10px] font-medium uppercase tracking-wider">Width</span>
          <input
            type="range"
            min={1}
            max={20}
            value={lineWidth}
            onChange={e => setLineWidth(Number(e.target.value))}
            className="w-24 accent-red-500"
          />
          <span className="text-white/70 text-xs w-5 text-right tabular-nums">{lineWidth}</span>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={undo} disabled={shapes.length === 0} title="Undo" className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <RotateCcw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Undo</span>
          </button>
          <button onClick={clear} disabled={shapes.length === 0} title="Clear all" className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs text-white/70 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-30">
            <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || shapes.length === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-green-600 hover:bg-green-500 text-white transition-colors disabled:opacity-50 ml-1"
          >
            <Check className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save Markup"}
          </button>
          <button onClick={onClose} className="ml-1 p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex items-center justify-center overflow-auto p-4">
        <div className="relative" style={{ cursor: "crosshair" }}>
          {/* Hidden img for natural dimensions */}
          <img
            ref={imgRef}
            src={photoUrl}
            crossOrigin="anonymous"
            className="hidden"
            onLoad={(e) => {
              const canvas = canvasRef.current;
              if (!canvas) return;
              canvas.width = e.target.naturalWidth;
              canvas.height = e.target.naturalHeight;
              setImgLoaded(true);
            }}
          />
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-[calc(100vh-120px)] block rounded-lg shadow-2xl"
            style={{ touchAction: "none" }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
          />
        </div>
      </div>

      <p className="text-center text-xs text-white/30 pb-2">Draw on the photo, then click "Save Markup" to replace it with the annotated version.</p>
    </div>
  );
}