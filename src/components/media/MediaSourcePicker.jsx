import React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * A file picker that looks like a button.
 *
 * The real <input type="file"> sits transparent on top of the control, so the
 * tap itself lands on the input and the phone opens its own camera / photo
 * sheet. Nothing is opened from script, which some mobile browsers refuse —
 * that was what made the picker close and do nothing.
 */
export default function MediaSourcePicker({
  onSelect,
  accept = "image/*,application/pdf,.pdf,.heic,.heif",
  disabled = false,
  title,
  variant = "outline",
  size = "sm",
  className,
  unstyled = false,
  children,
}) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    // Clear first so choosing the same file twice still fires a change.
    e.target.value = "";
    if (file) onSelect(file);
  };

  // A caller that positions the control itself (an "absolute inset-0" tap tile)
  // keeps its own positioning — otherwise the control anchors the overlay.
  const selfPositioned = /\b(absolute|fixed|sticky)\b/.test(className || "");

  return (
    <label
      title={title}
      className={cn(
        "cursor-pointer",
        !selfPositioned && "relative",
        !unstyled && buttonVariants({ variant, size }),
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleFile}
        aria-label={title || "Choose a file"}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
    </label>
  );
}