import React, { useEffect } from "react";
import { X } from "lucide-react";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";

export default function PhotoLightbox({ url, label, annotations, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 no-print"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      {label && (
        <div className="absolute top-4 left-4 text-white text-sm font-semibold uppercase tracking-widest opacity-70">
          {label}
        </div>
      )}
      <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full">
        <AnnotatedImage
          src={url}
          annotations={annotations || []}
          alt={label}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: "90vh" }}
        />
      </div>
    </div>
  );
}