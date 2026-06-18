import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Plus, Trash2, Image } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function PhotoRow({ item, isFirst, index, onUpdate, onRemove }) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await base44.integrations.Core.UploadFile({ file });
    onUpdate({ ...item, photo_url: result.file_url });
    setUploading(false);
    e.target.value = "";
  };

  const inputId = `cmm-photo-${index}`;
  const replaceId = `cmm-photo-replace-${index}`;

  const photoOnly = !isFirst && item.photo_only;

  return (
    <div className={`grid gap-4 items-start border border-border/40 rounded-xl p-4 bg-muted/10 ${photoOnly ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[1fr_3fr]"}`}>
      {/* Note column */}
      {!photoOnly && (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Note</p>
        {isFirst ? (
          <p className="text-sm font-semibold text-foreground">Final position on CMM table before running program</p>
        ) : (
          <Textarea
            value={item.note || ""}
            onChange={e => onUpdate({ ...item, note: e.target.value })}
            placeholder="Add a note..."
            className="min-h-[100px] text-sm resize-none"
          />
        )}
        {!isFirst && (
          <Button size="sm" variant="ghost" onClick={onRemove}
            className="self-start h-7 text-xs text-destructive hover:text-destructive gap-1 px-1">
            <Trash2 className="w-3.5 h-3.5" /> Remove
          </Button>
        )}
      </div>
      )}

      {/* Photo column */}
      <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/10" style={{ minHeight: "280px" }}>
        {photoOnly && (
          <button onClick={onRemove} className="absolute top-2 left-2 z-10 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        {item.photo_url ? (
          <>
            <img src={item.photo_url} alt="" className="w-full h-full object-cover absolute inset-0" style={{ minHeight: "280px" }} />
            <div className="absolute top-2 right-2 flex gap-1.5">
              <label htmlFor={replaceId} className="bg-black/60 hover:bg-black/90 text-white rounded-lg p-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
              </label>
              <input id={replaceId} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
              <button onClick={() => onUpdate({ ...item, photo_url: "" })}
                className="bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <label htmlFor={inputId}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
            <input id={inputId} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={handleFile} />
            {uploading ? (
              <div className="w-7 h-7 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Image className="w-14 h-14 opacity-20" />
                <span className="text-sm font-medium opacity-50">Click to upload photo</span>
              </>
            )}
          </label>
        )}
      </div>
    </div>
  );
}

export default function CMMWorkHolding({ items = [], onChange }) {
  const ensuredItems = items.length > 0 ? items : [{ _id: "first", note: "", photo_url: "" }];

  const updateItem = (idx, updated) => {
    const next = [...ensuredItems];
    next[idx] = updated;
    onChange(next);
  };

  const addItem = (photoOnly = false) => {
    onChange([...ensuredItems, { _id: `row_${Date.now()}`, note: "", photo_url: "", photo_only: photoOnly }]);
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

      <div className="space-y-5">
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

      <div className="flex gap-3 mt-6">
        <button onClick={() => addItem(false)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-colors font-medium text-sm">
          <Plus className="w-4 h-4" /> Add Note &amp; Photo
        </button>
        <button onClick={() => addItem(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors font-medium text-sm">
          <Image className="w-4 h-4" /> Add Photo Only
        </button>
      </div>
    </div>
  );
}