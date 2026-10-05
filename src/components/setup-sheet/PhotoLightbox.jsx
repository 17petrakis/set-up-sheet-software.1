import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";

const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const touchDistance = (touches) =>
  Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

const touchMidpoint = (touches) => ({
  x: (touches[0].clientX + touches[1].clientX) / 2,
  y: (touches[0].clientY + touches[1].clientY) / 2,
});

export default function PhotoLightbox({ url, label, annotations, onClose }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const gesture = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Every photo opens unzoomed.
  useEffect(() => { setView({ scale: 1, x: 0, y: 0 }); gesture.current = null; }, [url]);

  if (!url) return null;

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      gesture.current = {
        mode: "pinch",
        scale: view.scale,
        x: view.x,
        y: view.y,
        startDistance: touchDistance(e.touches) || 1,
        startMidpoint: touchMidpoint(e.touches),
      };
    } else if (e.touches.length === 1 && view.scale > 1) {
      gesture.current = {
        mode: "pan",
        scale: view.scale,
        x: view.x,
        y: view.y,
        touchX: e.touches[0].clientX,
        touchY: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e) => {
    const active = gesture.current;
    if (!active) return;

    if (active.mode === "pinch" && e.touches.length === 2) {
      e.preventDefault();
      const scale = clamp(
        active.scale * (touchDistance(e.touches) / active.startDistance),
        1,
        MAX_SCALE,
      );
      const midpoint = touchMidpoint(e.touches);
      const offsetX = midpoint.x - active.startMidpoint.x;
      const offsetY = midpoint.y - active.startMidpoint.y;
      setView({
        scale,
        x: scale === 1 ? 0 : active.x + offsetX,
        y: scale === 1 ? 0 : active.y + offsetY,
      });
      return;
    }

    if (active.mode === "pan" && e.touches.length === 1) {
      e.preventDefault();
      setView({
        scale: active.scale,
        x: active.x + (e.touches[0].clientX - active.touchX),
        y: active.y + (e.touches[0].clientY - active.touchY),
      });
    }
  };

  const endGesture = () => { gesture.current = null; };

  // Double click / double tap toggles zoom, so photos zoom on a desktop too.
  const toggleZoom = () => {
    setView((current) =>
      current.scale > 1
        ? { scale: 1, x: 0, y: 0 }
        : { scale: DOUBLE_TAP_SCALE, x: 0, y: 0 },
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 overflow-hidden no-print"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      {label && (
        <div className="absolute top-4 left-4 z-10 text-white text-sm font-semibold uppercase tracking-widest opacity-70">
          {label}
        </div>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={toggleZoom}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endGesture}
        onTouchCancel={endGesture}
        className="max-w-full max-h-full flex items-center justify-center"
        style={{ touchAction: "none" }}
      >
        <div
          className="origin-center will-change-transform"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <AnnotatedImage
            src={url}
            annotations={annotations || []}
            alt={label}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            style={{ maxHeight: "90vh" }}
          />
        </div>
      </div>
    </div>
  );
}