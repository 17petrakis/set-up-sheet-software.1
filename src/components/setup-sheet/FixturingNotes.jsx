import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { Wrench, ImagePlus, X, Loader2 } from "lucide-react";

export default function FixturingNotes({ data, onChange }) {
  const update = (field) => (e) => onChange({ ...data, [field]: e.target.value });
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange({ ...data, photo: file_url });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = () => {
    onChange({ ...data, photo: undefined });
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Fixturing Notes" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Fixture
            </Label>
            <Input
              value={data.fixture ?? ""}
              onChange={update("fixture")}
              placeholder="e.g. Tombstone, Angle plate, Vise stop..."
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Vise
            </Label>
            <Input
              value={data.vise ?? ""}
              onChange={update("vise")}
              placeholder="e.g. 5&quot; Kurt vise, Self-centering..."
              className="h-9 text-sm bg-background border-border/60"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Work Holding Notes
          </Label>
          <AutoResizeTextarea
            value={data.work_holding_notes ?? ""}
            onChange={update("work_holding_notes")}
            placeholder="e.g. Self centering vice on the tombstone, held in place by bolts on E9, E13. Stock is held on the 5&quot; width, extending 1.65&quot; out from top of vise. Torque vice to 65 FT LBS"
            className="min-h-[80px] text-sm bg-background border-border/60"
          />
        </div>

        {/* Fixturing Photo */}
        <div className="mt-4">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
            Fixturing Photo
          </Label>
          {data.photo ? (
            <div className="relative group rounded-lg overflow-hidden border border-border/60">
              <img src={data.photo} alt="Fixturing" className="w-full max-h-72 object-contain bg-muted/20" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-background/90 hover:bg-background shadow-sm border border-border/60 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors text-muted-foreground"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ImagePlus className="w-5 h-5" />
              )}
              <span className="text-xs">{uploading ? "Uploading…" : "Click to upload photo"}</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}