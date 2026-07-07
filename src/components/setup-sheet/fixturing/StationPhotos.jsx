import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2 } from "lucide-react";
import PhotoLightbox from "@/components/setup-sheet/PhotoLightbox";

/**
 * Per-station photo manager. Each photo renders large (~half width) with the
 * correlating note beside it.
 * photos: [{ url, note }]
 */
export default function StationPhotos({ photos, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const photosArr = photos || [];

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...photosArr, { url: file_url, note: "" }]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateNote = (i, note) => {
    const next = [...photosArr];
    next[i] = { ...next[i], note };
    onChange(next);
  };

  const removePhoto = (i) => {
    onChange(photosArr.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Photos</span>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>
      {photosArr.map((p, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1 rounded-lg overflow-hidden border border-border/60 bg-muted/10" style={{ minHeight: "320px" }}>
            <img src={p.url} alt="" className="w-full h-full object-contain absolute inset-0 cursor-zoom-in" style={{ minHeight: "320px" }} onClick={() => setLightboxUrl(p.url)} />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <Textarea
            value={p.note || ""}
            onChange={(e) => updateNote(i, e.target.value)}
            placeholder="Photo note…"
            className="sm:w-56 shrink-0 h-full min-h-[320px] text-sm bg-background border-border/60 resize-none"
          />
        </div>
      ))}
      {lightboxUrl && (
        <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}