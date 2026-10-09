import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Image, Plus, MessageSquare, Trash2, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PhotoLightbox from "./PhotoLightbox";
import ThumbnailToggle, { ThumbnailBadge } from "./ThumbnailToggle";
import ThumbnailContextMenu from "./ThumbnailContextMenu";
import ImageAnnotator from "@/components/annotation/ImageAnnotator";
import { migratePhotoSlots, DEFAULT_CATEGORIES, getEffectiveIconSlotId } from "@/lib/photoSlots";
import { safeStorageUrl, isPdfUrl } from "@/lib/mediaUrl";
import MediaSourcePicker from "@/components/media/MediaSourcePicker";
import { PHOTO_OVERLAY, PHOTO_ACTION, ADD_MEDIA } from "@/lib/tapTargets";

function CustomPhotoTitleDialog({ open, onClose, onFile }) {
  const [title, setTitle] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Photo</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter photo title..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="min-h-11 lg:min-h-0">Cancel</Button>
          <MediaSourcePicker
            variant="default"
            size="default"
            disabled={!title.trim()}
            className="min-h-11 lg:min-h-0"
            onSelect={(file) => { onFile(title.trim() || "Custom Photo", file); setTitle(""); }}
          >
            Upload Photo
          </MediaSourcePicker>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotoSlot({ label, url, note, annotations, onAnnotationsChange, onUpload, onRemove, onOpenPhoto, onNoteChange, onDeleteSlot, onLabelChange, large, readOnly = false, thumbnailImage = "", onThumbnailChange }) {
  const [uploading, setUploading] = useState(false);
  const [showNote, setShowNote] = useState(!!note);
  const [editingLabel, setEditingLabel] = useState(false);
  const [annotating, setAnnotating] = useState(false);
  const hasAnnotations = annotations && annotations.length > 0;

  // The stored link is untrusted — any signed-in user can write it — so it is
  // checked before it is handed to the browser, and only a real .pdf path may be
  // embedded in the document viewer.
  const safeUrl = safeStorageUrl(url);
  const isPdf = Boolean(safeUrl) && isPdfUrl(safeUrl);

  if (readOnly && !url) return null;

  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      onUpload(result.file_url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {annotating && (
        <ImageAnnotator
          imageUrl={url}
          initialAnnotations={annotations || []}
          onSave={(newAnns) => { onAnnotationsChange(newAnns); setAnnotating(false); }}
          onCancel={() => setAnnotating(false)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {editingLabel && onLabelChange ? (
          <input
            autoFocus
            value={label}
            onChange={(e) => onLabelChange(e.target.value)}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
            className="text-xs font-bold text-foreground uppercase tracking-widest bg-transparent border-b border-primary outline-none min-w-0 flex-1"
          />
        ) : (
          <span
            className={`text-xs font-bold text-foreground uppercase tracking-widest ${onLabelChange && !readOnly ? "cursor-text" : ""}`}
            onClick={() => onLabelChange && !readOnly && setEditingLabel(true)}
          >
            {label}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
          {safeUrl && !readOnly && !isPdf && (
            <button
              onClick={() => setAnnotating(true)}
              className={`${PHOTO_ACTION} ${hasAnnotations ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"}`}
              title="Annotate photo"
            >
              <PenTool className="w-3.5 h-3.5" />
              {hasAnnotations ? `Markup (${annotations.length})` : "Markup"}
            </button>
          )}
          {url && !readOnly && (
            <ThumbnailToggle
              isThumbnail={!!thumbnailImage && thumbnailImage === url}
              onToggle={() => onThumbnailChange(thumbnailImage === url ? "" : url)}
            />
          )}
          {url && !readOnly && (
            <button
              onClick={() => setShowNote((v) => !v)}
              className={`${PHOTO_ACTION} ${
                showNote ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {showNote ? "Hide note" : "Add note"}
            </button>
          )}
          {onDeleteSlot && !readOnly && (
            <button
              onClick={onDeleteSlot}
              className={`${PHOTO_ACTION} text-muted-foreground hover:text-destructive`}
              title="Delete photo field"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Photo + note */}
      <div className={large ? "flex flex-col sm:flex-row gap-3" : "contents"}>
        <ThumbnailContextMenu
          isThumbnail={!!thumbnailImage && thumbnailImage === url}
          onToggle={() => onThumbnailChange(thumbnailImage === url ? "" : url)}
          disabled={!url || readOnly}
        >
        <div
          className={`relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/10 ${large ? "flex-1" : ""}`}
          style={{ minHeight: large ? "500px" : "420px" }}
        >
          {url ? (
            <>
              {thumbnailImage === url && <ThumbnailBadge />}
              {isPdf ? (
                <iframe
                  src={safeUrl}
                  title={label}
                  className="absolute inset-0 w-full h-full border-0"
                  style={{ minHeight: large ? "500px" : "420px" }}
                />
              ) : safeUrl ? (
                <img
                  src={safeUrl}
                  alt={label}
                  className={`w-full h-full absolute inset-0 cursor-pointer ${large ? "object-contain" : "object-cover"}`}
                  style={{ minHeight: large ? "500px" : "420px" }}
                  onClick={onOpenPhoto}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Image className="w-10 h-10 opacity-30" />
                  <span className="text-sm font-medium">This file link can't be shown here.</span>
                </div>
              )}
              {!readOnly && (
              <div className="absolute top-2 right-2 flex gap-1.5 no-print">
                <MediaSourcePicker
                  unstyled
                  onSelect={uploadFile}
                  title="Replace photo"
                  className={`${PHOTO_OVERLAY} bg-black/60 hover:bg-black/90 text-white cursor-pointer`}
                >
                  <Upload className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                </MediaSourcePicker>
                <button
                  onClick={onRemove}
                  className={`${PHOTO_OVERLAY} bg-black/60 hover:bg-red-600 text-white`}
                  title="Remove photo"
                >
                  <X className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                </button>
              </div>
              )}
            </>
          ) : (
            <MediaSourcePicker
              unstyled
              onSelect={uploadFile}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            >
              {uploading ? (
                <div className="w-7 h-7 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Image className="w-14 h-14 opacity-20" />
                  <span className="text-sm font-medium opacity-50">Tap to upload</span>
                </>
              )}
            </MediaSourcePicker>
          )}
        </div>
        </ThumbnailContextMenu>

        {(showNote || note) && (
          large ? (
            <div className="sm:w-64 shrink-0">
              <Textarea
                value={note || ""}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Add a note for this photo..."
                className="h-full min-h-[500px] text-sm bg-background border-border/60 resize-none"
              />
            </div>
          ) : (
            <Textarea
              value={note || ""}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Add a note for this photo..."
              className="h-16 text-sm bg-background border-border/60 resize-none"
            />
          )
        )}
      </div>
    </div>
  );
}

export default function PhotoSection({ photos = {}, onChange, readOnly = false, thumbnailImage = "", onThumbnailChange }) {
  const slots = useMemo(() => migratePhotoSlots(photos), [photos]);
  const [uploading, setUploading] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [lightboxId, setLightboxId] = useState(null);

  const updateSlots = (newSlots) => onChange({
    __slots: newSlots,
    ...(photos.__icon_slot_id ? { __icon_slot_id: photos.__icon_slot_id } : {}),
    ...(photos.__icon_cleared ? { __icon_cleared: true } : {}),
  });

  const addPhoto = async (file, category, customTitle) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const newSlot = { id: `slot_${Date.now()}`, url: result.file_url, note: "" };
      if (category === "custom") {
        newSlot.category = "custom";
        newSlot.label = customTitle || "Custom Photo";
      } else {
        const cat = DEFAULT_CATEGORIES.find(c => c.key === category);
        newSlot.category = category;
        const count = slots.filter(s => s.category === category).length;
        newSlot.label = count === 0 ? `${cat.label} Photo` : `${cat.label} Photo ${count + 1}`;
      }
      updateSlots([...slots, newSlot]);
    } catch (err) {
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleCustomFile = (title, file) => {
    setCustomDialogOpen(false);
    addPhoto(file, "custom", title);
  };

  const handleSlotUpload = (id, url) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, url } : s));
  };

  const handleSlotRemove = (id) => {
    const newSlots = slots.filter(s => s.id !== id);
    if (iconSlotId === id) {
      onChange({ __slots: newSlots, __icon_slot_id: undefined, __icon_cleared: true });
    } else {
      updateSlots(newSlots);
    }
  };

  const handleSlotNoteChange = (id, note) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, note } : s));
  };

  const handleSlotLabelChange = (id, newLabel) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, label: newLabel } : s));
  };

  const handleSlotAnnotationsChange = (id, annotations) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, annotations } : s));
  };

  const iconSlotId = getEffectiveIconSlotId(photos);

  // The viewer walks through every photo on the sheet.
  const photoSlots = slots.filter((s) => s.url);
  const lightboxIndex = photoSlots.findIndex((s) => s.id === lightboxId);
  const lightboxSlot = lightboxIndex >= 0 ? photoSlots[lightboxIndex] : null;
  const stepPhoto = (delta) => {
    if (photoSlots.length < 2) return;
    setLightboxId(photoSlots[(lightboxIndex + delta + photoSlots.length) % photoSlots.length].id);
  };

  const handleToggleIcon = (id) => {
    if (iconSlotId === id) {
      // Removing the current icon — clear it and suppress auto-selection
      onChange({ ...photos, __icon_slot_id: undefined, __icon_cleared: true });
    } else {
      // Setting a new explicit icon
      onChange({ ...photos, __icon_slot_id: id, __icon_cleared: false });
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Photos
        </h2>
      </div>
      <div className="border-b border-border mb-5" />

      {!readOnly && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            onClick={() => setCustomDialogOpen(true)}
            disabled={uploading}
            variant="outline"
            size="sm"
            className={ADD_MEDIA}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Photo
          </Button>
          {DEFAULT_CATEGORIES.map(({ key, label }) => (
            <MediaSourcePicker
              key={key}
              onSelect={(file) => addPhoto(file, key)}
              disabled={uploading}
              className={ADD_MEDIA}
            >
              {uploading ? (
                <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add {label} Photo
            </MediaSourcePicker>
          ))}
        </div>
      )}

      <CustomPhotoTitleDialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        onFile={handleCustomFile}
      />

      {lightboxSlot && (
        <PhotoLightbox
          url={lightboxSlot.url}
          label={lightboxSlot.label}
          annotations={lightboxSlot.annotations}
          position={photoSlots.length > 1 ? `${lightboxIndex + 1} / ${photoSlots.length}` : undefined}
          onPrev={photoSlots.length > 1 ? () => stepPhoto(-1) : undefined}
          onNext={photoSlots.length > 1 ? () => stepPhoto(1) : undefined}
          onClose={() => setLightboxId(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-8">
        {slots.map((slot) => (
          <PhotoSlot
            key={slot.id}
            label={slot.label}
            url={slot.url}
            note={slot.note}
            annotations={slot.annotations}
            onAnnotationsChange={(annotations) => handleSlotAnnotationsChange(slot.id, annotations)}
            onUpload={(url) => handleSlotUpload(slot.id, url)}
            onRemove={() => handleSlotRemove(slot.id)}
            onOpenPhoto={() => setLightboxId(slot.id)}
            onDeleteSlot={() => handleSlotRemove(slot.id)}
            onNoteChange={(note) => handleSlotNoteChange(slot.id, note)}
            onLabelChange={(newLabel) => handleSlotLabelChange(slot.id, newLabel)}
            large={slot.category === "work_holding"}
            readOnly={readOnly}
            thumbnailImage={thumbnailImage}
            onThumbnailChange={onThumbnailChange || (() => {})}
          />
        ))}
      </div>
    </div>
  );
}