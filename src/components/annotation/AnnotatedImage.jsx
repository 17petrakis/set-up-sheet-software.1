import React, { useState, useEffect } from "react";
import ShapeElement from "./ShapeElement";

/**
 * Read-only display: renders an image with a non-interactive SVG annotation overlay.
 * The SVG viewBox is set to the image's natural dimensions, so annotations scale
 * perfectly at any display size.
 *
 * When no annotations exist, renders a plain img (preserves existing behavior).
 */
export default function AnnotatedImage({ src, annotations, alt, className, style, onClick }) {
  const [natural, setNatural] = useState({ w: 0, h: 0 });

  const hasAnns = annotations && annotations.length > 0;

  useEffect(() => {
    if (!src || !hasAnns) return;
    const img = new Image();
    img.onload = () => setNatural({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = src;
  }, [src, hasAnns]);

  // No annotations — just render a plain img (existing behavior)
  if (!hasAnns) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        onClick={onClick}
      />
    );
  }

  // Has annotations — render img + SVG overlay.
  // Strip w-full → max-w-full and remove object-contain/cover so the img element
  // matches the image content exactly (no letterboxing), keeping the SVG aligned.
  const annClass = (className || "")
    .replace("w-full", "max-w-full")
    .replace("object-contain", "")
    .replace("object-cover", "")
    .replace(/\s+/g, " ")
    .trim();
  const maxHeight = style?.maxHeight;

  return (
    <div className="flex justify-center">
      <div className="relative inline-block max-w-full">
        <img
          src={src}
          alt={alt}
          className={`block max-w-full ${annClass}`}
          style={{ maxHeight, cursor: onClick ? "zoom-in" : "default" }}
          onLoad={(e) => setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          onClick={onClick}
        />
        {natural.w > 0 && (
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${natural.w} ${natural.h}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", borderRadius: "inherit" }}
          >
            {annotations.map(ann => (
              <ShapeElement key={ann.id} ann={ann} />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}