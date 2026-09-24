import React, { useState } from "react";
import PhotoLightbox from "./PhotoLightbox";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";

export default function ViewPhoto({ url, label, annotations, className, style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <PhotoLightbox url={url} label={label} annotations={annotations} onClose={() => setOpen(false)} />}
      <AnnotatedImage
        src={url}
        annotations={annotations || []}
        alt={label}
        className={`cursor-zoom-in ${className || ""}`}
        style={style}
        onClick={() => setOpen(true)}
      />
    </>
  );
}