import React, { useState, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Image, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import PhotoLightbox from "./PhotoLightbox";
import { migratePhotoSlots, DEFAULT_CATEGORIES } from "@/lib/photoSlots";

function CustomPhotoTitleDialog({ open, onClose, onConfirm }) {
  const [title, setTitle] = useState("");

  const handleConfirm = () => {
    if (!title.trim()) return;
    onConfirm(title.trim());
    setTitle("");
  };

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
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!title.trim()}>Upload Photo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PhotoSlot({ slotKey, label, url, note, onUpload, onRemove, onNoteChange, onDeleteSlot, onLabelChange, large, readOnly = false }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [showNote, setShowNote] = useState(!!note);
  const [editingLabel, setEditingLabel] = useState(false);

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
  const slots = useMemo(() => migratePhotoSlots(photos), [photos]);
  const fileInputRef = useRef(null);
  const [pendingCategory, setPendingCategory] = useState(null);
  const [pendingCustomTitle, setPendingCustomTitle] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  const updateSlots = (newSlots) => onChange({ __slots: newSlots });

  const handleFileSelect = (category) => {
    setPendingCategory(category);
    fileInputRef.current?.click();
  };

  const handleCustomConfirm = (title) => {
    setPendingCustomTitle(title);
    setPendingCategory("custom");
    setCustomDialogOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) { setPendingCategory(null); setPendingCustomTitle(null); return; }
    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const newSlot = { id: `slot_${Date.now()}`, url: result.file_url, note: "" };
      if (pendingCategory === "custom") {
        newSlot.category = "custom";
        newSlot.label = pendingCustomTitle || "Custom Photo";
      } else {
        const cat = DEFAULT_CATEGORIES.find(c => c.key === pendingCategory);
        newSlot.category = pendingCategory;
        const count = slots.filter(s => s.category === pendingCategory).length;
        newSlot.label = count === 0 ? `${cat.label} Photo` : `${cat.label} Photo ${count + 1}`;
      }
      updateSlots([...slots, newSlot]);
    } catch (err) {
      alert("Upload failed: " + (err?.message || "Unknown error"));
    } finally {
      setUploading(false);
      setPendingCategory(null);
      setPendingCustomTitle(null);
      e.target.value = "";
    }
  };

  const handleSlotUpload = (id, url) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, url } : s));
  };

  const handleSlotRemove = (id) => {
    updateSlots(slots.filter(s => s.id !== id));
  };

  const handleSlotNoteChange = (id, note) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, note } : s));
  };

  const handleSlotLabelChange = (id, newLabel) => {
    updateSlots(slots.map(s => s.id === id ? { ...s, label: newLabel } : s));
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
            className="h-8 px-3 text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Custom Photo
          </Button>
          {DEFAULT_CATEGORIES.map(({ key, label }) => (
            <Button
              key={key}
              onClick={() => handleFileSelect(key)}
              disabled={uploading}
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5"
            >
              {uploading && pendingCategory === key ? (
                <div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Add {label} Photo
            </Button>
          ))}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.pdf,.heic,.heif" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      <CustomPhotoTitleDialog
        open={customDialogOpen}
        onClose={() => setCustomDialogOpen(false)}
        onConfirm={handleCustomConfirm}
      />

      <div className="grid grid-cols-1 gap-8">
        {slots.map((slot) => (
          <PhotoSlot
            key={slot.id}
            slotKey={slot.id}
            label={slot.label}
            url={slot.url}
            note={slot.note}
            onUpload={(url) => handleSlotUpload(slot.id, url)}
            onRemove={() => handleSlotRemove(slot.id)}
            onDeleteSlot={() => handleSlotRemove(slot.id)}
            onNoteChange={(note) => handleSlotNoteChange(slot.id, note)}
            onLabelChange={(newLabel) => handleSlotLabelChange(slot.id, newLabel)}
            large={slot.category === "work_holding"}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}