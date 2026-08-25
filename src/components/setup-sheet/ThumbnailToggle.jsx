import React from "react";
import { Star } from "lucide-react";

/**
 * Badge overlay shown on the image that is currently the sheet thumbnail.
 * Place inside a relative-positioned image container.
 */
export function ThumbnailBadge({ className = "" }) {
  return (
    <div
      className={`absolute top-2 left-2 bg-amber-500 text-white rounded-full p-1.5 shadow-lg z-10 ${className}`}
      title="This is the thumbnail image"
    >
      <Star className="w-3.5 h-3.5 fill-white" />
    </div>
  );
}

/**
 * Toggle button to set or clear an image as the sheet thumbnail.
 * Hidden in read-only / view mode.
 */
export default function ThumbnailToggle({ isThumbnail, onToggle, readOnly = false, className = "" }) {
  if (readOnly) return null;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`no-print flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors shrink-0 ${
        isThumbnail
          ? "text-amber-600 bg-amber-50 border border-amber-200"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
      } ${className}`}
      title={isThumbnail ? "Remove as thumbnail" : "Set as thumbnail"}
    >
      <Star className={`w-3 h-3 ${isThumbnail ? "fill-amber-500 text-amber-500" : ""}`} />
      {isThumbnail ? "Thumbnail" : "Set as Thumbnail"}
    </button>
  );
}