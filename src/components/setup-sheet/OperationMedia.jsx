import React, { useState, useRef, useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import PhotoLightbox from "@/components/setup-sheet/PhotoLightbox";
import { Plus, X, Loader2, Film, Image as ImageIcon, Pencil, Trash2 } from "lucide-react";

/**
 * Media items: [{ url, type: "image"|"video", title, note }]
 */
export default function OperationMedia({ items, onChange }) {
  const viewMode = useContext(ViewModeContext);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);

  const media = items || [];

  if (viewMode && media.length === 0) return null;

  const detectType = (file) => {
    if (file.type.startsWith("video/")) return "video";
    return "image";
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...media, { url: file_url, type: detectType(file), title: "", note: "" }]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateItem = (i, patch) => {
    const next = [...media];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const removeItem = (i) => {
    onChange(media.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-8 px-3 text-xs gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Media
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {media.map((m, i) => (
        <div key={i} className="border border-border/60 rounded-lg overflow-hidden bg-background">
          {/* Title */}
          <div className="p-3 pb-2">
            {viewMode ? (
              m.title && (
                <div className="flex items-center gap-1.5">
                  {m.type === "video" ? <Film className="w-3.5 h-3.5 text-muted-foreground" /> : <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                  <p className="text-sm font-semibold text-foreground">{m.title}</p>
                </div>
              )
            ) : (
              <div className="flex items-center gap-2">
                {m.type === "video" ? <Film className="w-3.5 h-3.5 text-muted-foreground" /> : <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />}
                <Input
                  value={m.title || ""}
                  onChange={(e) => updateItem(i, { title: e.target.value })}
                  placeholder="Add a title…"
                  className="h-8 text-sm flex-1 bg-background border-border/60"
                />
              </div>
            )}
          </div>

          {/* Media preview */}
          <div className="relative bg-muted/10">
            {m.type === "video" ? (
              <video
                src={m.url}
                controls
                className="w-full max-h-[420px] object-contain bg-black"
              />
            ) : (
              <img
                src={m.url}
                alt={m.title || ""}
                className="w-full max-h-[420px] object-contain cursor-zoom-in"
                onClick={() => !viewMode && setLightboxUrl(m.url)}
              />
            )}
            {!viewMode && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
                title="Remove media"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Note */}
          <div className="p-3 pt-2">
            {viewMode ? (
              m.note && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{m.note}</p>
            ) : (
              <AutoResizeTextarea
                value={m.note || ""}
                onChange={(e) => updateItem(i, { note: e.target.value })}
                placeholder="Add a note…"
                className="min-h-[48px] text-sm bg-background border-border/60"
              />
            )}
          </div>
        </div>
      ))}

      {lightboxUrl && <PhotoLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </div>
  );
}