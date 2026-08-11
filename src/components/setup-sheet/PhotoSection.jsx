import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Image, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import PhotoLightbox from "./PhotoLightbox";

const DEFAULT_SLOTS = [
  { key: "drawing", label: "Drawing" },
  { key: "work_holding", label: "Work Holding" },
  { key: "material_stock", label: "Material Stock" },
  { key: "iso", label: "ISO View" },
  { key: "final_part", label: "Final Part 1" },
  { key: "final_part_2", label: "Final Part 2" },
];

function PhotoSlot({ slotKey, label, url, note, onUpload, onRemove, onNoteChange, onDeleteSlot, large, readOnly = false }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [showNote, setShowNote] = useState(!!note);

  const isPdf = url && (url.toLowerCase().includes(".pdf") || url.toLowerCase().includes("application/pdf") || url.includes("pdf"));

  if (readOnly && !url) return null;

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
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
      e.target.value = "";
    }
  };

  const inputId = `photo-input-${slotKey}`;
  const replaceId = `photo-replace-${slotKey}`;

  return (
    <div className="flex flex-col gap-2">
      {lightbox && <PhotoLightbox url={url} label={label} onClose={() => setLightbox(false)} />}

      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
          {url && !readOnly && (
            <button
              onClick={() => setShowNote((v) => !v)}
              className={`no-print flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors ${
                showNote ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              {showNote ? "Hide note" : "Add note"}
            </button>
          )}
          {onDeleteSlot && !readOnly && (
            <button
              onClick={onDeleteSlot}
              className="no-print flex items-center gap-1 text-xs px-2 py-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
              title="Delete photo field"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Photo + note */}
      <div className={large ? "flex flex-col sm:flex-row gap-3" : "contents"}>
        <div
          className={`relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/10 ${large ? "flex-1" : ""}`}
          style={{ minHeight: large ? "500px" : "420px" }}
        >
          {url ? (
            <>
              {isPdf ? (
                <iframe
                  src={url}
                  title={label}
                  className="absolute inset-0 w-full h-full border-0"
                  style={{ minHeight: large ? "500px" : "420px" }}
                />
              ) : (
                <img
                  src={url}
                  alt={label}
                  className={`w-full h-full absolute inset-0 cursor-pointer ${large ? "object-contain" : "object-cover"}`}
                  style={{ minHeight: large ? "500px" : "420px" }}
                  onClick={() => setLightbox(true)}
                />
              )}
              {!readOnly && (
              <div className="absolute top-2 right-2 flex gap-1.5 no-print">
                <label
                  htmlFor={replaceId}
                  className="bg-black/60 hover:bg-black/90 text-white rounded-lg p-1.5 transition-colors cursor-pointer"
                  title="Replace photo"
                >
                  <Upload className="w-3.5 h-3.5" />
                </label>
                <input id={replaceId} type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={handleFile} />
                <button
                  onClick={onRemove}
                  className="bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
                  title="Remove photo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              )}
            </>
          ) : (
            <label
              htmlFor={inputId}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <input id={inputId} type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={handleFile} />
              {uploading ? (
                <div className="w-7 h-7 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Image className="w-14 h-14 opacity-20" />
                  <span className="text-sm font-medium opacity-50">Click to upload</span>
                </>
              )}
            </label>
          )}
        </div>

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

export default function PhotoSection({ photos = {}, onChange, readOnly = false }) {
  // Extra slots beyond the defaults, stored as array of { key, label } in photos.__extra_slots
  const extraSlots = photos.__extra_slots || [];
  const addFileInputRef = useRef(null);
  const [addingSlot, setAddingSlot] = useState(false);

  const handleUpload = (key, url) => onChange({ ...photos, [key]: url });

  const handleRemove = (key) => {
    const updated = { ...photos };
    delete updated[key];
    // Also remove note
    delete updated[`${key}__note`];
    onChange(updated);
  };

  const handleNoteChange = (key, note) => {
    onChange({ ...photos, [`${key}__note`]: note });
  };

  const handleAddPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddingSlot(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const idx = extraSlots.length + 1;
      const newKey = `extra_${Date.now()}`;
      const newLabel = `Photo ${DEFAULT_SLOTS.length + idx}`;
      const newExtra = [{ key: newKey, label: newLabel }, ...extraSlots];
      onChange({ ...photos, __extra_slots: newExtra, [newKey]: result.file_url });
    } catch (err) {
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setAddingSlot(false);
      e.target.value = "";
    }
  };

  const removeExtraSlot = (key) => {
    const updated = { ...photos };
    delete updated[key];
    delete updated[`${key}__note`];
    updated.__extra_slots = extraSlots.filter((s) => s.key !== key);
    onChange(updated);
  };

  const allSlots = [...extraSlots, ...DEFAULT_SLOTS];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Photos
        </h2>
        {!readOnly && (
        <>
          <button
            onClick={() => addFileInputRef.current?.click()}
            disabled={addingSlot}
            className="no-print flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors disabled:opacity-50"
          >
            {addingSlot ? (
              <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add Photo
          </button>
          <input ref={addFileInputRef} type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={handleAddPhotoFile} />
        </>
        )}
      </div>
      <div className="border-b border-border mb-5" />
      <div className="grid grid-cols-1 gap-8">
        {allSlots.map(({ key, label }) => {
          const isExtra = extraSlots.some((s) => s.key === key);
          return (
            <PhotoSlot
              key={key}
              slotKey={key}
              label={label}
              url={photos[key]}
              note={photos[`${key}__note`]}
              onUpload={(url) => handleUpload(key, url)}
              onRemove={() => (isExtra ? removeExtraSlot(key) : handleRemove(key))}
              onDeleteSlot={isExtra ? () => removeExtraSlot(key) : undefined}
              onNoteChange={(note) => handleNoteChange(key, note)}
              large={key === "work_holding"}
              readOnly={readOnly}
            />
          );
        })}
      </div>
    </div>
  );
}