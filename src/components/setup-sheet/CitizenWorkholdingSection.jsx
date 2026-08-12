import React, { useContext, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { Button } from "@/components/ui/button";
import SectionHeader from "./SectionHeader";
import { ViewModeContext } from "@/lib/viewModeContext";
import { base44 } from "@/api/base44Client";
import { Wrench, Loader2, X, Upload } from "lucide-react";

function FieldWrap({ label, children }) {
  return (
    <div>
      <Label className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export default function CitizenWorkholdingSection({ data, onChange }) {
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
      set("part_ejection_photo", file_url);
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
        <SectionHeader icon={Wrench} title="Workholding / Part Eject" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          {/* Bar Loader Collet */}
          <FieldWrap label="Bar Loader Collet — Size">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.bar_loader_collet_size || "—"}</p>
            ) : (
              <Input value={d.bar_loader_collet_size || ""} onChange={(e) => set("bar_loader_collet_size", e.target.value)} placeholder="e.g. 12mm" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>

          {/* MS Collet */}
          <FieldWrap label="MS Collet — Size">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.ms_collet_size || "—"}</p>
            ) : (
              <Input value={d.ms_collet_size || ""} onChange={(e) => set("ms_collet_size", e.target.value)} placeholder="e.g. 12mm" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
          <FieldWrap label="MS Collet — Shape">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.ms_collet_shape || "—"}</p>
            ) : (
              <Input value={d.ms_collet_shape || ""} onChange={(e) => set("ms_collet_shape", e.target.value)} placeholder="e.g. Round" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>

          {/* Guide Bush */}
          <FieldWrap label="Guide Bush — Size">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.guide_bush_size || "—"}</p>
            ) : (
              <Input value={d.guide_bush_size || ""} onChange={(e) => set("guide_bush_size", e.target.value)} placeholder="e.g. 12mm" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
          <FieldWrap label="Guide Bush — Shape">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.guide_bush_shape || "—"}</p>
            ) : (
              <Input value={d.guide_bush_shape || ""} onChange={(e) => set("guide_bush_shape", e.target.value)} placeholder="e.g. Round" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
          <FieldWrap label="Guide Bush — Material">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.guide_bush_material || "—"}</p>
            ) : (
              <Input value={d.guide_bush_material || ""} onChange={(e) => set("guide_bush_material", e.target.value)} placeholder="e.g. Carbide" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>

          {/* SS Collet */}
          <FieldWrap label="SS Collet — Size">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.ss_collet_size || "—"}</p>
            ) : (
              <Input value={d.ss_collet_size || ""} onChange={(e) => set("ss_collet_size", e.target.value)} placeholder="e.g. 12mm" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
          <FieldWrap label="SS Collet — Shape">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.ss_collet_shape || "—"}</p>
            ) : (
              <Input value={d.ss_collet_shape || ""} onChange={(e) => set("ss_collet_shape", e.target.value)} placeholder="e.g. Round" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
          <FieldWrap label="SS Collet — Stickout">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.ss_collet_stickout || "—"}</p>
            ) : (
              <Input value={d.ss_collet_stickout || ""} onChange={(e) => set("ss_collet_stickout", e.target.value)} placeholder='e.g. 2.500"' className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
          <FieldWrap label="SS Collet — Special">
            {viewMode ? (
              <p className="text-sm font-semibold text-foreground min-h-[2.25rem] flex items-center">{d.ss_collet_special || "—"}</p>
            ) : (
              <Input value={d.ss_collet_special || ""} onChange={(e) => set("ss_collet_special", e.target.value)} placeholder="Describe if special…" className="h-9 text-sm bg-card border-border font-medium" />
            )}
          </FieldWrap>
        </div>

        {/* Part Ejection */}
        <div className="mt-4 border-t border-border/40 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Part Ejection</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <FieldWrap label="Description">
              {viewMode ? (
                <p className="text-sm text-foreground whitespace-pre-wrap min-h-[2.25rem]">{d.part_ejection_description || "—"}</p>
              ) : (
                <AutoResizeTextarea value={d.part_ejection_description || ""} onChange={(e) => set("part_ejection_description", e.target.value)} placeholder="Describe part ejection…" className="min-h-[48px] text-sm bg-card border-border font-medium" />
              )}
            </FieldWrap>
            <FieldWrap label="Photo">
              {viewMode ? (
                d.part_ejection_photo ? (
                  <img src={d.part_ejection_photo} alt="Part ejection" className="w-full max-h-[280px] object-contain rounded-lg border border-border/60 bg-muted/10" />
                ) : (
                  <p className="text-sm text-muted-foreground min-h-[2.25rem] flex items-center">—</p>
                )
              ) : (
                <div className="space-y-2">
                  {d.part_ejection_photo && (
                    <div className="relative">
                      <img src={d.part_ejection_photo} alt="Part ejection" className="w-full max-h-[280px] object-contain rounded-lg border border-border/60 bg-muted/10" />
                      <button type="button" onClick={() => set("part_ejection_photo", "")} className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-lg p-1.5 transition-colors" title="Remove photo">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-8 px-3 text-xs gap-1.5">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {d.part_ejection_photo ? "Replace Photo" : "Add Photo"}
                  </Button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>
              )}
            </FieldWrap>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}