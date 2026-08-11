import React, { useContext } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import OperationMedia from "./OperationMedia";
import { ClipboardList } from "lucide-react";

export default function OperationNotes({ value, onChange, media, onMediaChange, machineType }) {
  const viewMode = useContext(ViewModeContext);

  if (viewMode && (!value || !value.trim()) && (!media || media.length === 0)) return null;

  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Operation Notes / Instruction</h2>
        </div>
        <div className="space-y-4">
          <AutoResizeTextarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Add any operation notes or instructions here..."
            className="min-h-[96px] text-sm bg-background border-border/60"
          />
          <OperationMedia items={media || []} onChange={onMediaChange} />
        </div>
      </CardContent>
    </Card>
  );
}