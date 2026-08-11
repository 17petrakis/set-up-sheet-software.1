import React, { useContext, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import SectionHeader from "./SectionHeader";
import { ViewModeContext } from "@/lib/viewModeContext";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Upload } from "lucide-react";

export default function MediaNoteSection({ data, onChange, title, icon }) {
  const viewMode = useContext(ViewModeContext);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const d = data || {};
  const set = (field, val) => onChange({ ...d, [field]: val });

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set("photo", file_url);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={icon} title={title} />

        <div className="space-y-3">
          {/* Photo — fills section width */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Photo</p>
            {viewMode ? (
              d.photo ? (
                <div className="flex justify-center">
                  <img src={d.photo} alt={title} className="max-w-full max-h-[420px] object-contain rounded-lg border border-border/60 bg-muted/10" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground min-h-[2.25rem] flex items-center justify-center">—</p>
              )
            ) : (
              <div className="space-y-2">
                {d.photo && (
                  <div className="relative">
                    <img src={d.photo} alt={title} className="w-full max-h-[420px] object-contain rounded-lg border border-border/60 bg-muted/10" />
                    <button type="button" onClick={() => set("photo", "")} className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors" title="Remove photo">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-8 px-3 text-xs gap-1.5">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {d.photo ? "Replace Photo" : "Add Photo"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </div>
            )}
          </div>

          {/* Note — below photo */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Note</p>
            {viewMode ? (
              <p className="text-sm text-foreground whitespace-pre-wrap min-h-[2.25rem]">{d.note || "—"}</p>
            ) : (
              <AutoResizeTextarea value={d.note || ""} onChange={(e) => set("note", e.target.value)} placeholder="Add a note…" className="min-h-[80px] text-sm bg-background border-border/60" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}