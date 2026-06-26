import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Plus, X, Loader2 } from "lucide-react";

/**
 * Per-station photo manager. Each photo has a URL and a correlating note.
 * photos: [{ url, note }]
 */
export default function StationPhotos({ photos, onChange }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

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
    <div className="space-y-2">
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
        <div key={i} className="flex gap-2 items-start">
          <div className="relative shrink-0">
            <img src={p.url} alt="" className="w-16 h-16 object-cover rounded-md border border-border/60" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute -top-1 -right-1 p-0.5 rounded-full bg-background border border-border/60 text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <Input
            value={p.note || ""}
            onChange={(e) => updateNote(i, e.target.value)}
            placeholder="Photo note…"
            className="h-9 text-sm bg-background border-border/60"
          />
        </div>
      ))}
    </div>
  );
}