import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ImagePlus, Loader2, PenTool, Trash2 } from "lucide-react";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";
import ImageAnnotator from "@/components/annotation/ImageAnnotator";
import PhotoLightbox from "./PhotoLightbox";
import MediaSourcePicker from "@/components/media/MediaSourcePicker";
import { PHOTO_OVERLAY, PHOTO_ACTION, ADD_MEDIA } from "@/lib/tapTargets";

const detectType = (file) => {
  if (file.type?.startsWith("video/")) return "video";
  return /\.(mp4|mov|avi|webm|mkv|m4v|ogg|3gp)$/i.test(file.name || "") ? "video" : "image";
};

export default function ProcessStepMedia({ media = [], onChange }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [annotating, setAnnotating] = useState(null);

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange([...media, { url: file_url, type: detectType(file), annotations: [] }]);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  // The photos of this set, in order — the viewer swipes between them.
  const imageIndexes = media.map((m, i) => (m.type === "video" ? -1 : i)).filter((i) => i !== -1);

  const updateItem = (i, patch) => {
    const next = [...media];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {media.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {media.map((m, i) => (
            <div key={i} className="relative rounded-lg overflow-hidden border border-border/60 bg-muted/10">
              {m.type === "video" ? (
                <video src={m.url} controls className="w-full max-h-[320px] object-contain bg-black" />
              ) : (
                <AnnotatedImage
                  src={m.url}
                  annotations={m.annotations || []}
                  alt=""
                  className="w-full max-h-[320px] object-contain cursor-zoom-in"
                  onClick={() => setLightbox(i)}
                />
              )}
              <button
                type="button"
                onClick={() => onChange(media.filter((_, idx) => idx !== i))}
                className={`${PHOTO_OVERLAY} absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white`}
                title="Remove media"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {m.type !== "video" && (
                <button
                  type="button"
                  onClick={() => setAnnotating(i)}
                  className={`${PHOTO_ACTION} absolute top-2 left-2 ${m.annotations?.length ? "bg-blue-500 text-white" : "bg-black/60 hover:bg-black/90 text-white"}`}
                  title="Annotate photo"
                >
                  <PenTool className="w-3 h-3" />
                  {m.annotations?.length ? `${m.annotations.length}` : "Markup"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div>
        <MediaSourcePicker
          onSelect={uploadFile}
          accept="image/*,video/*"
          disabled={uploading}
          className={ADD_MEDIA}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          Add Photo / Video
        </MediaSourcePicker>
      </div>

      {lightbox !== null && media[lightbox] && (() => {
        const position = imageIndexes.indexOf(lightbox);
        const canNavigate = imageIndexes.length > 1;
        const step = (delta) => setLightbox(imageIndexes[(position + delta + imageIndexes.length) % imageIndexes.length]);
        return (
          <PhotoLightbox
            url={media[lightbox].url}
            annotations={media[lightbox].annotations}
            position={canNavigate ? `${position + 1} / ${imageIndexes.length}` : undefined}
            onPrev={canNavigate ? () => step(-1) : undefined}
            onNext={canNavigate ? () => step(1) : undefined}
            onClose={() => setLightbox(null)}
          />
        );
      })()}

      {annotating !== null && media[annotating] && (
        <ImageAnnotator
          imageUrl={media[annotating].url}
          initialAnnotations={media[annotating].annotations || []}
          onSave={(anns) => { updateItem(annotating, { annotations: anns }); setAnnotating(null); }}
          onCancel={() => setAnnotating(null)}
        />
      )}
    </div>
  );
}