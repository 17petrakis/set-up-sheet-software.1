import React, { useRef, useState } from "react";

const HANDLE_SCREEN = 20; // corner grip size in screen pixels

/**
 * The crop box shown over the whole photo. Its rectangle lives in the photo's
 * own pixel space, so what it selects is exactly what gets kept.
 */
export default function CropOverlay({ width, height, naturalWidth, naturalHeight, rect, onChange }) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [, setDragging] = useState(null);

  const scale = width > 0 ? naturalWidth / width : 1; // photo pixels per screen pixel
  const handle = HANDLE_SCREEN * scale;
  const minSize = 56 * scale;

  const clamp = (r) => {
    const w = Math.min(Math.max(r.w, minSize), naturalWidth);
    const h = Math.min(Math.max(r.h, minSize), naturalHeight);
    return {
      x: Math.min(Math.max(r.x, 0), Math.max(0, naturalWidth - w)),
      y: Math.min(Math.max(r.y, 0), Math.max(0, naturalHeight - h)),
      w,
      h,
    };
  };

  const toNatural = (e) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return { x: 0, y: 0 };
    return {
      x: ((e.clientX - box.left) / box.width) * naturalWidth,
      y: ((e.clientY - box.top) / box.height) * naturalHeight,
    };
  };

  const begin = (e, mode, corner) => {
    e.preventDefault();
    e.stopPropagation();
    svgRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = { mode, corner, start: toNatural(e), from: rect };
    setDragging(mode);
  };

  const move = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toNatural(e);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    const from = d.from;

    if (d.mode === "move") {
      onChange(clamp({ ...from, x: from.x + dx, y: from.y + dy }));
      return;
    }

    let left = from.x;
    let top = from.y;
    let right = from.x + from.w;
    let bottom = from.y + from.h;
    if (d.corner.includes("w")) left = Math.min(Math.max(0, from.x + dx), right - minSize);
    if (d.corner.includes("e")) right = Math.max(Math.min(naturalWidth, from.x + from.w + dx), left + minSize);
    if (d.corner.includes("n")) top = Math.min(Math.max(0, from.y + dy), bottom - minSize);
    if (d.corner.includes("s")) bottom = Math.max(Math.min(naturalHeight, from.y + from.h + dy), top + minSize);
    onChange({ x: left, y: top, w: right - left, h: bottom - top });
  };

  const end = (e) => {
    try { svgRef.current?.releasePointerCapture?.(e.pointerId); } catch (_) { /* ignore */ }
    dragRef.current = null;
    setDragging(null);
  };

  const inset = handle * 0.75;
  // Grips sit just inside the corner so they stay reachable when the box is the
  // full photo.
  const grips = [
    { id: "nw", x: rect.x + inset, y: rect.y + inset },
    { id: "ne", x: rect.x + rect.w - inset, y: rect.y + inset },
    { id: "se", x: rect.x + rect.w - inset, y: rect.y + rect.h - inset },
    { id: "sw", x: rect.x + inset, y: rect.y + rect.h - inset },
  ];

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      preserveAspectRatio="none"
      style={{ position: "absolute", top: 0, left: 0, touchAction: "none" }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <path
        d={`M0 0H${naturalWidth}V${naturalHeight}H0Z M${rect.x} ${rect.y}h${rect.w}v${rect.h}h${-rect.w}Z`}
        fill="rgba(0,0,0,0.6)"
        fillRule="evenodd"
        style={{ cursor: "move" }}
        onPointerDown={(e) => begin(e, "move")}
      />
      <rect
        x={rect.x} y={rect.y} width={rect.w} height={rect.h}
        fill="transparent"
        pointerEvents="all"
        style={{ cursor: "move" }}
        onPointerDown={(e) => begin(e, "move")}
      />
      <rect
        x={rect.x} y={rect.y} width={rect.w} height={rect.h}
        fill="none" stroke="#ffffff" strokeWidth={2 * scale}
        pointerEvents="none"
      />
      {grips.map((g) => (
        <rect
          key={g.id}
          x={g.x - handle / 2} y={g.y - handle / 2}
          width={handle} height={handle}
          rx={4 * scale}
          fill="#ffffff" stroke="#3b82f6" strokeWidth={2 * scale}
          style={{ cursor: "pointer" }}
          onPointerDown={(e) => begin(e, "resize", g.id)}
        />
      ))}
    </svg>
  );
}