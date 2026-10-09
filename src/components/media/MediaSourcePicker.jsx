import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Images, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

// On a phone or tablet the button offers the camera as well as the photo
// library; with a mouse it goes straight to the file picker, as it always did.
const isTouchDevice = () =>
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

/**
 * Button that yields a chosen file. Touch devices get a "Take Photo" option
 * that opens the camera directly.
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
  const libraryRef = useRef(null);
  const cameraRef = useRef(null);
  const [choosing, setChoosing] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  };

  const pick = (source) => {
    setChoosing(false);
    // Still inside the tap that picked the source, so the browser opens it.
    (source === "camera" ? cameraRef.current : libraryRef.current)?.click();
  };

  return (
    <>
      <button
        type="button"
        title={title}
        disabled={disabled}
        onClick={() => (isTouchDevice() ? setChoosing(true) : pick("library"))}
        className={unstyled ? className : cn(buttonVariants({ variant, size }), className)}
      >
        {children}
      </button>
      <input ref={libraryRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {choosing &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-black/60 flex items-end sm:items-center justify-center p-3 pb-6 sm:p-4"
            onClick={() => setChoosing(false)}
          >
            <div
              className="w-full sm:max-w-sm bg-card border border-border rounded-2xl p-4 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-foreground">Add a photo</p>
                <button
                  type="button"
                  onClick={() => setChoosing(false)}
                  className="p-2 -m-1 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => pick("camera")}
                className="w-full flex items-center gap-3 min-h-16 px-4 rounded-xl border border-border bg-background hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Take Photo</span>
                  <span className="block text-xs text-muted-foreground">Open the camera now</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => pick("library")}
                className="w-full flex items-center gap-3 min-h-16 px-4 rounded-xl border border-border bg-background hover:bg-muted/50 active:bg-muted transition-colors text-left"
              >
                <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Images className="w-5 h-5 text-primary" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Choose from Library</span>
                  <span className="block text-xs text-muted-foreground">Photos already on this device</span>
                </span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}