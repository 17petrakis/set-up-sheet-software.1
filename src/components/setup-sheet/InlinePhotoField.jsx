import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Image } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import PhotoLightbox from "./PhotoLightbox";

let _seq = 0;

export default function InlinePhotoField({ value, note, onUpload, onRemove, onNoteChange, label = "Photo" }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [showNote, setShowNote] = useState(!!note);
  const [inputId] = useState(() => `inline-photo-${++_seq}`);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onUpload(result.file_url);
    } catch (err) {
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
      e.target.value = "";
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
            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${showNote ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            {showNote ? "Hide note" : "Add note"}
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/10 flex-1" style={{ minHeight: "340px" }}>
          {value ? (
            <>
              <img
                src={value}
                alt={label}
                className="w-full h-full object-contain absolute inset-0 cursor-pointer"
                style={{ minHeight: "340px" }}
                onClick={() => setLightbox(true)}
              />
              <div className="absolute top-2 right-2 flex gap-1.5">
                <label htmlFor={inputId} className="bg-black/60 hover:bg-black/90 text-white rounded-lg p-1.5 cursor-pointer transition-colors" title="Replace photo">
                  <Upload className="w-3.5 h-3.5" />
                </label>
                <input id={inputId} type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={handleFile} />
                <button type="button" onClick={onRemove} className="bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors" title="Remove photo">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <label htmlFor={inputId} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
              <input id={inputId} type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={handleFile} />
              {uploading ? (
                <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Image className="w-10 h-10 opacity-20" />
                  <span className="text-xs font-medium opacity-50">Click to upload</span>
                </>
              )}
            </label>
          )}
        </div>

        {(showNote || note) && (
          <div className="sm:w-56 shrink-0">
            <Textarea
              value={note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note for this photo..."
              className="h-full min-h-[340px] text-sm bg-background border-border/60 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}