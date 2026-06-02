import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, X, Image } from "lucide-react";
import PhotoLightbox from "./PhotoLightbox";

const PHOTO_SLOTS = [
  { key: "work_holding", label: "Work Holding" },
  { key: "drawing", label: "Drawing" },
  { key: "iso", label: "ISO View" },
  { key: "material_stock", label: "Material Stock" },
  { key: "final_part", label: "Final Part 1" },
  { key: "final_part_2", label: "Final Part 2" },
];

function PhotoSlot({ label, url, onUpload, onRemove }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(false);

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
      {lightbox && <PhotoLightbox url={url} label={label} onClose={() => setLightbox(false)} />}
      <span className="text-xs font-bold text-foreground uppercase tracking-widest">{label}</span>
      <div
        className="relative rounded-lg overflow-hidden border-2 border-dashed border-border bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
        style={{ minHeight: "220px" }}
        onClick={() => url ? setLightbox(true) : inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        {url ? (
          <>
            <img src={url} alt={label} className="w-full h-full object-cover absolute inset-0" style={{ minHeight: "220px" }} />
            <div className="absolute top-2 right-2 flex gap-1.5 no-print">
              <button
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="bg-black/60 hover:bg-black/90 text-white rounded-lg p-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            {uploading ? (
              <div className="w-7 h-7 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <>
                <Image className="w-10 h-10 opacity-30" />
                <span className="text-sm font-medium opacity-50">Click to upload</span>
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

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-bold text-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
        <Camera className="w-4 h-4 text-primary" />
        Photos
      </h2>
      <div className="border-b border-border mb-5" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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