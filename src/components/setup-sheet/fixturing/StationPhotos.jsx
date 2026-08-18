import React, { useState, useRef, useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { base44 } from "@/api/base44Client";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { Button } from "@/components/ui/button";
import { Plus, X, Loader2 } from "lucide-react";
import PhotoLightbox from "@/components/setup-sheet/PhotoLightbox";

/**
 * Per-station photo manager. Each photo renders large (~half width) with the
 * correlating note beside it.
 * photos: [{ url, note }]
 */
export default function StationPhotos({ photos, onChange, label = "Photos" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const viewMode = useContext(ViewModeContext);

  const photosArr = photos || [];

  if (viewMode && photosArr.length === 0) return null;

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
      {photosArr.length === 0 && (
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      )}
      {photosArr.map((p, i) => (
        <div key={i} className="flex flex-col sm:flex-row gap-3 items-stretch">
          <div className="relative flex-1 rounded-lg overflow-hidden border border-border/60 bg-muted/10 min-h-[180px] sm:min-h-[320px]">
            <img src={p.url} alt="" className="w-full h-full object-contain absolute inset-0 cursor-zoom-in min-h-[180px] sm:min-h-[320px]" onClick={() => setLightboxUrl(p.url)} />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
              title="Remove photo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <AutoResizeTextarea
            value={p.note || ""}
            onChange={(e) => updateNote(i, e.target.value)}
            placeholder="Photo note…"
            className="sm:w-56 shrink-0 text-sm font-medium bg-card border-border"
          />
        </div>
      ))}
      {!viewMode && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-8 px-3 text-xs gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Photo
        </Button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      {lightboxUrl && (
        <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  );
}