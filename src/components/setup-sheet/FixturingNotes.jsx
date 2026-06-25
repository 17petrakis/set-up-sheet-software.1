import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import SectionHeader from "./SectionHeader";
import { Wrench, Plus, X, Loader2 } from "lucide-react";
import { getMachineGroup } from "@/lib/machineGroups";
import HmcFixturing from "./fixturing/HmcFixturing";
import VmcSection from "./fixturing/VmcSection";
import DrillTapSection from "./fixturing/DrillTapSection";

export default function FixturingNotes({ data, onChange, machine }) {
  const group = getMachineGroup(machine);
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

  const removePhoto = () => onChange({ ...data, photo: undefined });

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <SectionHeader icon={Wrench} title="Fixturing Notes" />

        {!group ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            Select a machine in General Info to load fixturing options.
          </p>
        ) : group === "hmc" ? (
          <HmcFixturing data={data} onChange={onChange} />
        ) : group === "vmc" ? (
          <VmcSection data={data} onChange={onChange} />
        ) : (
          <DrillTapSection data={data} onChange={onChange} />
        )}

        {/* Fixturing Photo */}
        {group && (
          <div className="mt-3">
            {data.photo ? (
              <div className="relative inline-block rounded-lg overflow-hidden border border-border/60">
                <img src={data.photo} alt="Fixturing" className="max-h-64 object-contain bg-muted/20" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-background/90 hover:bg-background shadow-sm border border-border/60 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-border/60 hover:border-primary/40 hover:bg-muted/30 text-muted-foreground hover:text-primary transition-colors"
                title="Add fixturing photo"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
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
        )}
      </CardContent>
    </Card>
  );
}