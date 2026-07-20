import React, { useState } from "react";
import PhotoLightbox from "./PhotoLightbox";

export default function ViewPhoto({ url, label, className, style }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <PhotoLightbox url={url} label={label} onClose={() => setOpen(false)} />}
      <img
        src={url}
        alt={label || ""}
        onClick={() => setOpen(true)}
        className={`cursor-zoom-in ${className || ""}`}
        style={style}
      />
    </>
  );
}