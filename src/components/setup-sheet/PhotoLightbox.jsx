import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";

const MAX_SCALE = 6;
const DOUBLE_TAP_SCALE = 2.5;
const SWIPE_DISTANCE = 50; // px a finger must travel sideways to change photo

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const touchDistance = (touches) =>
  Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

const touchMidpoint = (touches) => ({
  x: (touches[0].clientX + touches[1].clientX) / 2,
  y: (touches[0].clientY + touches[1].clientY) / 2,
});

/**
 * Full-screen photo viewer. Zoomed out, a sideways swipe (or the arrows) moves
 * to the next/previous photo of the same set; zoomed in, one finger pans.
 */
export default function PhotoLightbox({ url, label, annotations, onClose, onPrev, onNext, position }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const gesture = useRef(null);
  const canNavigate = Boolean(onPrev || onNext);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

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
    } else if (e.touches.length === 1) {
      if (view.scale > 1) {
        gesture.current = {
          mode: "pan",
          scale: view.scale,
          x: view.x,
          y: view.y,
          touchX: e.touches[0].clientX,
          touchY: e.touches[0].clientY,
        };
      } else if (canNavigate) {
        gesture.current = {
          mode: "swipe",
          touchX: e.touches[0].clientX,
          touchY: e.touches[0].clientY,
        };
      }
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

  const handleTouchEnd = (e) => {
    const active = gesture.current;
    gesture.current = null;
    if (!active || active.mode !== "swipe") return;
    const touch = e.changedTouches?.[0];
    if (!touch) return;
    const dx = touch.clientX - active.touchX;
    const dy = touch.clientY - active.touchY;
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  };

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
        type="button"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-3 right-3 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        aria-label="Close photo"
      >
        <X className="w-6 h-6" />
      </button>

      {label && (
        <div className="absolute top-4 left-4 right-20 z-10 text-white text-sm font-semibold uppercase tracking-widest opacity-70 truncate">
          {label}
        </div>
      )}

      {onPrev && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          aria-label="Previous photo"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
          aria-label="Next photo"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {position && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-3 py-1 text-sm font-semibold text-white/85 tabular-nums">
          {position}
        </div>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={toggleZoom}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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