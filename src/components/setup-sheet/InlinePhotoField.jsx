import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Image } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import PhotoLightbox from "./PhotoLightbox";
import MediaSourcePicker from "@/components/media/MediaSourcePicker";
import { PHOTO_OVERLAY, PHOTO_ACTION } from "@/lib/tapTargets";

export default function InlinePhotoField({ value, note, onUpload, onRemove, onNoteChange, label = "Photo" }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [showNote, setShowNote] = useState(!!note);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onUpload(result.file_url);
    } catch (err) {
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {lightbox && value && <PhotoLightbox url={value} label={label} onClose={() => setLightbox(false)} />}

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Photo</span>
        {value && (
          <button
            type="button"
            onClick={() => setShowNote(v => !v)}
            className={`${PHOTO_ACTION} ${showNote ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            {showNote ? "Hide note" : "Add note"}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/10 flex-1" style={{ minHeight: "480px" }}>
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                className="w-full h-full object-contain absolute inset-0 cursor-pointer"
                style={{ minHeight: "480px" }}
                onClick={() => setLightbox(true)}
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <MediaSourcePicker
                  unstyled
                  onSelect={uploadFile}
                  title="Replace photo"
                  className={`${PHOTO_OVERLAY} bg-black/60 hover:bg-black/90 text-white cursor-pointer`}
                >
                  <Upload className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                </MediaSourcePicker>
                <button type="button" onClick={onRemove} className={`${PHOTO_OVERLAY} bg-black/60 hover:bg-red-600 text-white`} title="Remove photo">
                  <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <MediaSourcePicker
              unstyled
              onSelect={uploadFile}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            >
              {uploading ? (
                <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Image className="w-10 h-10 opacity-20" />
                  <span className="text-xs font-medium opacity-50">Tap to upload</span>
                </>
              )}
            </MediaSourcePicker>
          )}
        </div>

        {(showNote || note) && (
          <div className="sm:w-56 shrink-0">
            <Textarea
              value={note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note for this photo..."
              className="h-full min-h-[480px] text-sm bg-background border-border/60 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}