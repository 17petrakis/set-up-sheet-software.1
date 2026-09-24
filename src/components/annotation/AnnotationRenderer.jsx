import React, { useState, useRef } from "react";
import ShapeElement from "./ShapeElement";
import { newAnnId, moveAnnotation, resizeAnnotation, getCenter, rotatePt } from "./annotationGeometry";

const HANDLE_SIZE = 10;
const ROTATE_DIST = 24;

function Handles({ ann, scale, onHandlePointerDown }) {
  const hs = HANDLE_SIZE * scale;
  const rd = ROTATE_DIST * scale;
  const deg = ann.rotation || 0;

  if (ann.type === "line" || ann.type === "arrow") {
    return (
      <g>
        <circle
          cx={ann.x1} cy={ann.y1} r={hs}
          fill="white" stroke="#3b82f6" strokeWidth={2 * scale}
          style={{ cursor: "move" }}
          onPointerDown={(e) => onHandlePointerDown(e, "start")}
        />
        <circle
          cx={ann.x2} cy={ann.y2} r={hs}
          fill="white" stroke="#3b82f6" strokeWidth={2 * scale}
          style={{ cursor: "move" }}
          onPointerDown={(e) => onHandlePointerDown(e, "end")}
        />
      </g>
    );
  }

  if (ann.type === "pen") {
    const b = ann.points && ann.points.length > 0 ? (() => {
      const xs = ann.points.map(p => p.x), ys = ann.points.map(p => p.y);
      return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    })() : { x: 0, y: 0, w: 0, h: 0 };
    return (
      <rect
        x={b.x - 4 * scale} y={b.y - 4 * scale}
        width={b.w + 8 * scale} height={b.h + 8 * scale}
        fill="none" stroke="#3b82f6" strokeWidth={1.5 * scale}
        strokeDasharray={`${6 * scale} ${4 * scale}`}
        style={{ pointerEvents: "none" }}
      />
    );
  }

  // rect/ellipse/text: 8 resize handles + 1 rotate handle
  const cx = ann.x || 0, cy = ann.y || 0;
  const w = ann.width || 0, h = ann.height || 0;
  const localCorners = [
    { id: "nw", x: cx - w / 2, y: cy - h / 2 },
    { id: "ne", x: cx + w / 2, y: cy - h / 2 },
    { id: "se", x: cx + w / 2, y: cy + h / 2 },
    { id: "sw", x: cx - w / 2, y: cy + h / 2 },
    { id: "n", x: cx, y: cy - h / 2 },
    { id: "e", x: cx + w / 2, y: cy },
    { id: "s", x: cx, y: cy + h / 2 },
    { id: "w", x: cx - w / 2, y: cy },
  ];
  const cursorFor = (id) => {
    if (id === "n" || id === "s") return "ns-resize";
    if (id === "e" || id === "w") return "ew-resize";
    if (id === "ne" || id === "sw") return "nesw-resize";
    return "nwse-resize";
  };
  const rotateLocal = { x: cx, y: cy - h / 2 - rd };
  const topMid = { x: cx, y: cy - h / 2 };
  const rotateWorld = rotatePt(rotateLocal.x, rotateLocal.y, cx, cy, deg);
  const topMidWorld = rotatePt(topMid.x, topMid.y, cx, cy, deg);

  return (
    <g>
      <line
        x1={topMidWorld.x} y1={topMidWorld.y}
        x2={rotateWorld.x} y2={rotateWorld.y}
        stroke="#3b82f6" strokeWidth={1.5 * scale}
      />
      <circle
        cx={rotateWorld.x} cy={rotateWorld.y} r={hs}
        fill="white" stroke="#3b82f6" strokeWidth={2 * scale}
        style={{ cursor: "grab" }}
        onPointerDown={(e) => onHandlePointerDown(e, "rotate")}
      />
      {localCorners.map(c => {
        const wp = rotatePt(c.x, c.y, cx, cy, deg);
        return (
          <rect
            key={c.id}
            x={wp.x - hs / 2} y={wp.y - hs / 2}
            width={hs} height={hs}
            fill="white" stroke="#3b82f6" strokeWidth={2 * scale}
            style={{ cursor: cursorFor(c.id) }}
            onPointerDown={(e) => onHandlePointerDown(e, c.id)}
          />
        );
      })}
    </g>
  );
}

export default function AnnotationRenderer({
  annotations, selectedId, tool, width, height,
  naturalWidth, naturalHeight, currentStyle, svgRef,
  onAnnotationsChange, onBeginAction, onSelect, onTextEdit,
}) {
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  dragRef.current = drag;

  const vw = naturalWidth || width;
  const vh = naturalHeight || height;
  const scale = width > 0 ? (naturalWidth || width) / width : 1;

  const getPos = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (vw / rect.width),
      y: (e.clientY - rect.top) * (vh / rect.height),
    };
  };

  const handleSvgPointerDown = (e) => {
    if (tool === "select") {
      onSelect(null);
      return;
    }
    onBeginAction();
    const pos = getPos(e);
    const id = newAnnId();
    const base = {
      id,
      stroke: currentStyle.stroke,
      fill: currentStyle.fill,
      strokeWidth: currentStyle.strokeWidth * scale,
      rotation: 0,
    };

    if (tool === "text") {
      const newAnn = { ...base, type: "text", x: pos.x, y: pos.y, width: 200 * scale, height: 40 * scale, text: "", fontSize: currentStyle.fontSize * scale };
      onAnnotationsChange(prev => [...prev, newAnn]);
      onSelect(id);
      onTextEdit(id);
      return;
    }

    if (tool === "pen") {
      const newAnn = { ...base, type: "pen", points: [pos] };
      onAnnotationsChange(prev => [...prev, newAnn]);
      onSelect(id);
      svgRef.current?.setPointerCapture(e.pointerId);
      setDrag({ mode: "pen", id });
      return;
    }

    const newAnn = tool === "line" || tool === "arrow"
      ? { ...base, type: tool, x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y }
      : { ...base, type: tool, x: pos.x, y: pos.y, width: 0, height: 0 };
    onAnnotationsChange(prev => [...prev, newAnn]);
    onSelect(id);
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag({ mode: "create", id, start: pos });
  };

  const handleShapePointerDown = (e, ann) => {
    if (tool !== "select") return;
    e.stopPropagation();
    onSelect(ann.id);
    onBeginAction();
    const pos = getPos(e);
    const center = getCenter(ann);
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag({ mode: "move", id: ann.id, offset: { x: pos.x - center.x, y: pos.y - center.y } });
  };

  const handleShapeDoubleClick = (e, ann) => {
    if (tool !== "select" || ann.type !== "text") return;
    e.stopPropagation();
    onTextEdit(ann.id);
  };

  const handleHandlePointerDown = (e, handleId, ann) => {
    e.stopPropagation();
    onBeginAction();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrag({
      mode: handleId === "rotate" ? "rotate" : "resize",
      id: ann.id,
      handle: handleId,
      center: getCenter(ann),
    });
  };

  const handlePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const pos = getPos(e);

    if (d.mode === "pen") {
      onAnnotationsChange(prev => prev.map(a => {
        if (a.id !== d.id) return a;
        return { ...a, points: [...(a.points || []), pos] };
      }));
    } else if (d.mode === "create") {
      onAnnotationsChange(prev => prev.map(a => {
        if (a.id !== d.id) return a;
        if (a.type === "line" || a.type === "arrow") {
          return { ...a, x2: pos.x, y2: pos.y };
        }
        const cx = (d.start.x + pos.x) / 2;
        const cy = (d.start.y + pos.y) / 2;
        return { ...a, x: cx, y: cy, width: Math.abs(pos.x - d.start.x), height: Math.abs(pos.y - d.start.y) };
      }));
    } else if (d.mode === "move") {
      onAnnotationsChange(prev => prev.map(a => {
        if (a.id !== d.id) return a;
        const center = getCenter(a);
        const dx = (pos.x - d.offset.x) - center.x;
        const dy = (pos.y - d.offset.y) - center.y;
        return moveAnnotation(a, dx, dy);
      }));
    } else if (d.mode === "resize") {
      onAnnotationsChange(prev => prev.map(a => {
        if (a.id !== d.id) return a;
        if (a.type === "line" || a.type === "arrow") {
          if (d.handle === "start") return { ...a, x1: pos.x, y1: pos.y };
          return { ...a, x2: pos.x, y2: pos.y };
        }
        return resizeAnnotation(a, d.handle, pos);
      }));
    } else if (d.mode === "rotate") {
      const dx = pos.x - d.center.x;
      const dy = pos.y - d.center.y;
      const deg = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      onAnnotationsChange(prev => prev.map(a => a.id === d.id ? { ...a, rotation: Math.round(deg) } : a));
    }
  };

  const handlePointerUp = (e) => {
    const d = dragRef.current;
    if (d) {
      if (d.mode === "create") {
        onAnnotationsChange(prev => prev.map(a => {
          if (a.id !== d.id) return a;
          if (a.type === "rectangle" || a.type === "ellipse") {
            if ((a.width || 0) < 10 && (a.height || 0) < 10) {
              return { ...a, width: 100 * scale, height: 60 * scale };
            }
          }
          return a;
        }));
      }
      try { svgRef.current?.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    setDrag(null);
  };

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
      style={{ touchAction: "none", position: "absolute", top: 0, left: 0 }}
      onPointerDown={handleSvgPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {annotations.map(ann => (
        <g key={ann.id}>
          <ShapeElement
            ann={ann}
            interactive={tool === "select"}
            onPointerDown={tool === "select" ? (e) => handleShapePointerDown(e, ann) : undefined}
            onDoubleClick={tool === "select" ? (e) => handleShapeDoubleClick(e, ann) : undefined}
          />
          {selectedId === ann.id && tool === "select" && (
            <Handles
              ann={ann}
              scale={scale}
              onHandlePointerDown={(e, handleId) => handleHandlePointerDown(e, handleId, ann)}
            />
          )}
        </g>
      ))}
    </svg>
  );
}