import React, { useState, useEffect, useRef } from "react";

/**
 * Fixed-position textarea positioned over an SVG text annotation for editing.
 * Positioned using the SVG's viewBox ratio for accurate placement on high-res images.
 */
export default function TextEditorOverlay({ ann, svgRef, naturalWidth, naturalHeight, onChange, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState(null);
  const [canBlur, setCanBlur] = useState(false);
  const [text, setText] = useState(ann.text || "");

  useEffect(() => {
    setText(ann.text || "");
  }, [ann.id, ann.text]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    const vw = naturalWidth || r.width;
    const vh = naturalHeight || r.height;
    const sx = r.width / vw;
    const sy = r.height / vh;
    setPos({
      left: r.left + ((ann.x || 0) - (ann.width || 0) / 2) * sx,
      top: r.top + ((ann.y || 0) - (ann.height || 0) / 2) * sy,
      width: Math.max((ann.width || 0) * sx, 40),
      height: Math.max((ann.height || 0) * sy, 28),
      fontSize: (ann.fontSize || 28) * sy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ann.id, ann.x, ann.y, ann.width, ann.height, ann.fontSize, naturalWidth, naturalHeight]);

  useEffect(() => {
    setCanBlur(false);
    const t = setTimeout(() => setCanBlur(true), 150);
    return () => clearTimeout(t);
  }, [ann.id]);

  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }, []);

  if (!pos) return null;

  const commit = () => {
    onChange(text);
    onClose();
  };

  return (
    <textarea
      ref={ref}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => { if (canBlur) commit(); }}
      onKeyDown={(e) => {
        if (e.key === "Escape") { e.preventDefault(); ref.current.blur(); }
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(); }
      }}
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        width: pos.width,
        height: pos.height,
        fontSize: pos.fontSize,
        fontFamily: "Inter, sans-serif",
        fontWeight: 600,
        color: ann.stroke || "#ef4444",
        lineHeight: 1.25,
        textAlign: "center",
        background: "rgba(255,255,255,0.9)",
        border: "2px solid #3b82f6",
        borderRadius: 4,
        outline: "none",
        resize: "none",
        padding: 2,
        margin: 0,
        zIndex: 60,
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        boxSizing: "border-box",
      }}
    />
  );
}