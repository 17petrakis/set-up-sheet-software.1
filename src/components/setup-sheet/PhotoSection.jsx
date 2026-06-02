import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, ImagePlus } from "lucide-react";

const PHOTO_SLOTS = [
  { key: "work_holding", label: "Work Holding", icon: "🔩" },
  { key: "drawing", label: "Drawing", icon: "📐" },
  { key: "iso", label: "ISO View", icon: "🧊" },
  { key: "material_stock", label: "Material Stock", icon: "📦" },
  { key: "final_part", label: "Final Part", icon: "✅" },
];

function PhotoSlot({ label, icon, url, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    onUpload(file_url);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Label bar */}
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>

      {/* Photo area */}
      <div
        className="relative rounded-xl overflow-hidden border-2 border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer group"
        style={{ aspectRatio: "4/3" }}
        onClick={() => !url && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover" />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors no-print" />
            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1.5 no-print">
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="bg-black/60 hover:bg-black/90 text-white rounded-lg p-1.5 transition-colors backdrop-blur-sm"
                title="Replace photo"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors backdrop-blur-sm"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* Label overlay on image */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 print-show">
              <span className="text-white text-xs font-medium">{label}</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-8 h-8 opacity-40" />
                <span className="text-xs font-medium opacity-60">Click to upload</span>
              </>
            )}
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

  const uploadedCount = PHOTO_SLOTS.filter(({ key }) => photos[key]).length;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Camera className="w-4 h-4 text-primary" />
          Photos
        </h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {uploadedCount} / {PHOTO_SLOTS.length} uploaded
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {PHOTO_SLOTS.map(({ key, label, icon }) => (
          <PhotoSlot
            key={key}
            label={label}
            icon={icon}
            url={photos[key]}
            onUpload={(url) => handleUpload(key, url)}
            onRemove={() => handleRemove(key)}
          />
        ))}
      </div>
    </div>
  );
}