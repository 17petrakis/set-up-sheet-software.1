import React from "react";

/**
 * Renders a single annotation as SVG elements.
 * Used by both AnnotationRenderer (interactive) and AnnotatedImage (read-only).
 */
export default function ShapeElement({ ann, onPointerDown, interactive = false, onDoubleClick }) {
  const stroke = ann.stroke || "#ef4444";
  const fill = ann.fill || "transparent";
  const sw = ann.strokeWidth || 4;
  const deg = ann.rotation || 0;

  const commonProps = interactive
    ? { onPointerDown, onDoubleClick, style: { cursor: "move" } }
    : { style: { pointerEvents: "none" } };

  if (ann.type === "rectangle") {
    return (
      <rect
        x={(ann.x || 0) - (ann.width || 0) / 2}
        y={(ann.y || 0) - (ann.height || 0) / 2}
        width={ann.width || 0}
        height={ann.height || 0}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        transform={`rotate(${deg} ${ann.x || 0} ${ann.y || 0})`}
        {...commonProps}
      />
    );
  }

  if (ann.type === "ellipse") {
    return (
      <ellipse
        cx={ann.x || 0}
        cy={ann.y || 0}
        rx={(ann.width || 0) / 2}
        ry={(ann.height || 0) / 2}
        fill={fill}
        stroke={stroke}
        strokeWidth={sw}
        transform={`rotate(${deg} ${ann.x || 0} ${ann.y || 0})`}
        {...commonProps}
      />
    );
  }

  if (ann.type === "line") {
    return (
      <line
        x1={ann.x1} y1={ann.y1} x2={ann.x2} y2={ann.y2}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        {...commonProps}
      />
    );
  }

  if (ann.type === "arrow") {
    const dx = ann.x2 - ann.x1;
    const dy = ann.y2 - ann.y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const headLen = Math.max(10, sw * 3);
    const headAngle = Math.PI / 6;
    const p1x = ann.x2 - headLen * Math.cos(angle - headAngle);
    const p1y = ann.y2 - headLen * Math.sin(angle - headAngle);
    const p2x = ann.x2 - headLen * Math.cos(angle + headAngle);
    const p2y = ann.y2 - headLen * Math.sin(angle + headAngle);
    return (
      <g {...commonProps}>
        <line x1={ann.x1} y1={ann.y1} x2={ann.x2} y2={ann.y2}
          stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        {len > headLen && (
          <polygon
            points={`${ann.x2},${ann.y2} ${p1x},${p1y} ${p2x},${p2y}`}
            fill={stroke}
          />
        )}
      </g>
    );
  }

  if (ann.type === "text") {
    const fontSize = ann.fontSize || 28;
    const lines = (ann.text || "").split("\n");
    const lineHeight = fontSize * 1.25;
    const w = ann.width || 100;
    const h = Math.max(ann.height || 0, fontSize * lines.length * 1.25);
    return (
      <g transform={`rotate(${deg} ${ann.x || 0} ${ann.y || 0})`} {...commonProps}>
        <rect
          x={(ann.x || 0) - w / 2}
          y={(ann.y || 0) - h / 2}
          width={w}
          height={h}
          fill="transparent"
          stroke="none"
        />
        <text
          x={ann.x || 0}
          y={(ann.y || 0) - h / 2 + fontSize * 0.85}
          fill={stroke}
          fontSize={fontSize}
          fontFamily="Inter, sans-serif"
          fontWeight="600"
          textAnchor="middle"
        >
          {lines.map((line, i) => (
            <tspan key={i} x={ann.x || 0} dy={i === 0 ? 0 : lineHeight}>
              {line || " "}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  if (ann.type === "pen") {
    const pts = ann.points || [];
    if (pts.length === 0) return null;
    if (pts.length === 1) {
      return (
        <circle
          cx={pts[0].x} cy={pts[0].y} r={Math.max(sw / 2, 2)}
          fill={stroke}
          {...commonProps}
        />
      );
    }
    const ptsStr = pts.map(p => `${p.x},${p.y}`).join(" ");
    return (
      <polyline
        points={ptsStr}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...commonProps}
      />
    );
  }

  return null;
}