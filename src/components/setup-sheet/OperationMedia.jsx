import React, { useState, useRef, useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import PhotoLightbox from "@/components/setup-sheet/PhotoLightbox";
import ImageAnnotator from "@/components/annotation/ImageAnnotator";
import AnnotatedImage from "@/components/annotation/AnnotatedImage";
import { Plus, X, Loader2, GripVertical, PenTool } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import ThumbnailToggle, { ThumbnailBadge } from "./ThumbnailToggle";
import ThumbnailContextMenu from "./ThumbnailContextMenu";

/**
 * Media items: [{ url, type: "image"|"video", title, note }]
 */
export default function OperationMedia({ items, onChange, onAddNote, thumbnailImage = "", onThumbnailChange }) {
  const viewMode = useContext(ViewModeContext);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [editingTitle, setEditingTitle] = useState(null);
  const [annotatingIdx, setAnnotatingIdx] = useState(null);

  const media = items || [];

  if (viewMode && media.length === 0) return null;

  const detectType = (file) => {
    if (file.type.startsWith("video/")) return "video";
    const name = (file.name || "").toLowerCase();
    if (/\.(mp4|mov|avi|webm|mkv|m4v|ogg|3gp)$/.test(name)) return "video";
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

  const handleDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = [...media];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        {onAddNote && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onAddNote}
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Operation Note
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="h-8 px-3 text-xs gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Add Media (Photo/Video)
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {!viewMode && media.length > 1 && (
        <p className="text-xs text-muted-foreground">Drag the handle to reorder media.</p>
      )}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="operation-media">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
              {media.map((m, i) => (
                <Draggable key={i} draggableId={`media-${i}`} index={i} isDragDisabled={viewMode}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`border border-border/60 rounded-lg overflow-hidden bg-background ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
                    >
                      <div className="flex items-stretch">
                        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="p-3 pb-2 flex items-center gap-2">
            {viewMode ? (
              m.title ? (
                <p className="text-sm font-bold text-foreground flex-1">{m.title}</p>
              ) : (
                <span className="flex-1" />
              )
            ) : (
              <Input
                value={m.title || ""}
                onChange={(e) => updateItem(i, { title: e.target.value })}
                placeholder="Add a title…"
                className="h-9 text-sm font-bold flex-1 bg-background border-border/60"
              />
            )}
            {m.type === "image" && !viewMode && (
              <ThumbnailToggle
                isThumbnail={!!thumbnailImage && thumbnailImage === m.url}
                onToggle={() => onThumbnailChange(thumbnailImage === m.url ? "" : m.url)}
              />
            )}
            {!viewMode && (
              <div
                {...dragProvided.dragHandleProps}
                className="flex items-center justify-center w-8 h-9 shrink-0 bg-muted/30 hover:bg-muted/60 cursor-grab active:cursor-grabbing rounded-md border border-border/60"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Media preview */}
          <ThumbnailContextMenu
            isThumbnail={!!thumbnailImage && thumbnailImage === m.url}
            onToggle={() => onThumbnailChange(thumbnailImage === m.url ? "" : m.url)}
            disabled={m.type !== "image" || viewMode}
          >
            <div className="relative bg-muted/10">
              {m.type === "image" && thumbnailImage === m.url && <ThumbnailBadge />}
              {m.type === "video" ? (
                <video
                  src={m.url}
                  controls
                  className="w-full max-h-[420px] object-contain bg-black"
                />
              ) : (
                <AnnotatedImage
                  src={m.url}
                  annotations={m.annotations || []}
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
              {!viewMode && m.type === "image" && (
                <button
                  type="button"
                  onClick={() => setAnnotatingIdx(i)}
                  className={`absolute top-2 left-2 flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${m.annotations?.length ? "bg-blue-500 text-white" : "bg-black/60 hover:bg-black/90 text-white"}`}
                  title="Annotate photo"
                >
                  <PenTool className="w-3 h-3" />
                  {m.annotations?.length ? `${m.annotations.length}` : "Markup"}
                </button>
              )}
            </div>
          </ThumbnailContextMenu>

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
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {lightboxUrl && <PhotoLightbox url={lightboxUrl} annotations={media.find(m => m.url === lightboxUrl)?.annotations} onClose={() => setLightboxUrl(null)} />}
      {annotatingIdx !== null && media[annotatingIdx] && (
        <ImageAnnotator
          imageUrl={media[annotatingIdx].url}
          initialAnnotations={media[annotatingIdx].annotations || []}
          onSave={(newAnns) => { updateItem(annotatingIdx, { annotations: newAnns }); setAnnotatingIdx(null); }}
          onCancel={() => setAnnotatingIdx(null)}
        />
      )}
    </div>
  );
}