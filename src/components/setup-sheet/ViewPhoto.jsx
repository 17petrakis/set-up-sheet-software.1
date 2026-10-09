import React, { useState } from "react";
import PhotoLightbox from "./PhotoLightbox";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";

/**
 * Tappable photo. Pass `items` (the whole set it belongs to) when several photos
 * belong together — the opened viewer then swipes between them.
 */
export default function ViewPhoto({ url, label, annotations, className, style, items }) {
  const [openAt, setOpenAt] = useState(null);

  const photos = (items || []).filter((m) => m && m.url && m.type !== "video");
  const list = photos.length > 0 ? photos : [{ url, label, annotations }];
  const startIndex = Math.max(0, list.findIndex((m) => m.url === url));
  const canNavigate = list.length > 1;
  const currentIndex = Math.min(openAt ?? startIndex, list.length - 1);
  const active = openAt === null ? null : list[currentIndex];
  const step = (delta) => setOpenAt((current) => (current + delta + list.length) % list.length);

  return (
    <>
      {active && (
        <PhotoLightbox
          url={active.url}
          label={active.label ?? label}
          annotations={active.annotations}
          position={canNavigate ? `${currentIndex + 1} / ${list.length}` : undefined}
          onPrev={canNavigate ? () => step(-1) : undefined}
          onNext={canNavigate ? () => step(1) : undefined}
          onClose={() => setOpenAt(null)}
        />
      )}
      <AnnotatedImage
        src={url}
        annotations={annotations || []}
        alt={label}
        className={`cursor-zoom-in ${className || ""}`}
        style={style}
        onClick={() => setOpenAt(startIndex)}
      />
    </>
  );
}