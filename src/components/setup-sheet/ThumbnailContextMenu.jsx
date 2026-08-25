import React from "react";
import { Star } from "lucide-react";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem,
} from "@/components/ui/context-menu";

/**
 * Wraps an image/container with a right-click context menu to set or clear
 * the sheet thumbnail. Disabled (passthrough) in read-only mode or when no image.
 */
export default function ThumbnailContextMenu({ isThumbnail, onToggle, disabled = false, children }) {
  if (disabled) return children;
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="relative">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onSelect={onToggle} className="gap-2">
          <Star className={`w-4 h-4 ${isThumbnail ? "fill-amber-500 text-amber-500" : ""}`} />
          {isThumbnail ? "Remove as Thumbnail" : "Set as Thumbnail"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}