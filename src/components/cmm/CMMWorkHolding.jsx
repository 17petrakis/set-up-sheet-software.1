import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Plus, Trash2, Image, ZoomIn } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Lightbox({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 bg-black/60 hover:bg-black/90 text-white rounded-full p-2 transition-colors">
        <X className="w-5 h-5" />
      </button>
      <img
        src={url}
        alt=""
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

function PhotoRow({ item, isFirst, index, onUpdate, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputId = `cmm-photo-${index}`;
  const replaceId = `cmm-photo-replace-${index}`;

  const uploadFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    onUpdate({ ...item, photo_url: result.file_url });
    setUploading(false);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (file) { await uploadFile(file); e.target.value = ""; }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith("image/")) {
        const file = it.getAsFile();
        if (file) await uploadFile(file);
        break;
      }
    }
  };

  const noteOnly = item.type === "note" || item.photo_url === null;

  return (
    <>
      {/* Row */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className={`flex ${noteOnly ? "" : "divide-x divide-border"}`}>
          {/* Note column — 30% */}
          <div className={`${noteOnly ? "w-full" : "w-[30%] shrink-0"} p-4 flex flex-col justify-center`}>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {isFirst ? "Step 1" : `Step ${index + 1}`}
            </p>
            {isFirst ? (
              <p className="text-sm font-semibold text-foreground leading-snug">
                Final position on CMM table before running program
              </p>
            ) : (
              <Textarea
                value={item.note || ""}
                onChange={e => onUpdate({ ...item, note: e.target.value })}
                placeholder="Describe this step..."
                className="text-sm resize-none border-0 shadow-none p-0 focus-visible:ring-0 bg-transparent min-h-0 h-auto"
                rows={4}
              />
            )}
          </div>

          {/* Photo column — 70% */}
          {!noteOnly && (
            <div
              className={`flex-1 relative bg-muted/20 ${dragOver ? "bg-primary/5" : ""} transition-colors`}
              style={{ height: "300px" }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onPaste={handlePaste}
              tabIndex={0}
            >
              {item.photo_url ? (
                <>
                  {lightbox && <Lightbox url={item.photo_url} onClose={() => setLightbox(false)} />}
                  <img
                    src={item.photo_url}
                    alt=""
                    className="w-full h-full object-cover cursor-zoom-in"
                    onClick={() => setLightbox(true)}
                  />
                </>
              ) : (
                <label
                  htmlFor={inputId}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  <input id={inputId} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
                  {uploading ? (
                    <div className="w-7 h-7 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Image className="w-10 h-10 opacity-20" />
                      <span className="text-xs font-medium opacity-50">Click, drag & drop, or paste image</span>
                    </>
                  )}
                </label>
              )}
            </div>
          )}
        </div>

        {/* Toolbar below the row */}
        <div className="flex items-center justify-between gap-2 border-t border-border/50 px-4 py-1.5 bg-muted/10">
          {/* Left: photo actions */}
          <div className="flex items-center gap-1">
            {!noteOnly && item.photo_url && (
              <>
                <button onClick={() => setLightbox(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors">
                  <ZoomIn className="w-3.5 h-3.5" /> View
                </button>
                <label htmlFor={replaceId} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Replace
                </label>
                <input id={replaceId} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
                <button onClick={() => onUpdate({ ...item, photo_url: "" })} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10 transition-colors">
                  <X className="w-3.5 h-3.5" /> Remove photo
                </button>
              </>
            )}
            {!noteOnly && !item.photo_url && !uploading && (
              <label htmlFor={inputId} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Upload photo
              </label>
            )}
          </div>

          {/* Right: delete row */}
          {!isFirst && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10 transition-colors ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete row
            </button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this step?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the note and photo. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onRemove} className="bg-destructive hover:bg-destructive/90 text-white">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function CMMWorkHolding({ items = [], onChange }) {
  const ensuredItems = items.length > 0 ? items : [{ _id: "first", note: "", photo_url: "" }];

  const updateItem = (idx, updated) => {
    const next = [...ensuredItems];
    next[idx] = updated;
    onChange(next);
  };

  const addItemWithPhoto = () => {
    onChange([...ensuredItems, { _id: `row_${Date.now()}`, note: "", photo_url: "", type: "photo" }]);
  };

  const addNoteOnly = () => {
    onChange([...ensuredItems, { _id: `row_${Date.now()}`, note: "", photo_url: null, type: "note" }]);
  };

  const removeItem = (idx) => {
    onChange(ensuredItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center mb-1">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Work Holding
        </h2>
      </div>
      <div className="border-b border-border mb-5" />

      <div className="flex flex-col gap-3">
        {ensuredItems.map((item, idx) => (
          <PhotoRow
            key={item._id || idx}
            item={item}
            isFirst={idx === 0}
            index={idx}
            onUpdate={(updated) => updateItem(idx, updated)}
            onRemove={() => removeItem(idx)}
          />
        ))}
      </div>

      <div className="flex gap-3 mt-5">
        <button onClick={addNoteOnly}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="w-4 h-4" /> Add Note
        </button>
        <button onClick={addItemWithPhoto}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Camera className="w-4 h-4" /> Add Note & Photo
        </button>
      </div>
    </div>
  );
}