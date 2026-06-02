import React, { useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X } from "lucide-react";

const PHOTO_SLOTS = [
  { key: "work_holding", label: "Work Holding" },
  { key: "drawing", label: "Drawing" },
  { key: "iso", label: "ISO View" },
  { key: "material_stock", label: "Material Stock" },
  { key: "final_part", label: "Final Part" },
];

function PhotoSlot({ label, url, onUpload, onRemove }) {
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpload(file_url);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <div
        className="relative border-2 border-dashed border-border rounded-lg bg-muted/30 overflow-hidden flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
        style={{ aspectRatio: "4/3" }}
        onClick={() => !url && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-0.5 transition-colors no-print"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="absolute bottom-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors no-print"
            >
              <Upload className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground p-4">
            <Camera className="w-6 h-6" />
            <span className="text-xs">Upload photo</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhotoSection({ photos = {}, onChange }) {
  const handleUpload = (key, url) => onChange({ ...photos, [key]: url });
  const handleRemove = (key) => {
    const updated = { ...photos };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        Photos
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {PHOTO_SLOTS.map(({ key, label }) => (
          <PhotoSlot
            key={key}
            label={label}
            url={photos[key]}
            onUpload={(url) => handleUpload(key, url)}
            onRemove={() => handleRemove(key)}
          />
        ))}
      </div>
    </div>
  );
}