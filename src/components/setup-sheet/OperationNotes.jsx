import React, { useContext, useState } from "react";
import { ViewModeContext } from "@/lib/viewModeContext";
import { Card, CardContent } from "@/components/ui/card";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import OperationMedia from "./OperationMedia";
import { ClipboardList, Plus, X } from "lucide-react";

export default function OperationNotes({ value, onChange, media, onMediaChange, machineType }) {
  const viewMode = useContext(ViewModeContext);
  const [showNotes, setShowNotes] = useState(false);

  if (viewMode && (!value || !value.trim()) && (!media || media.length === 0)) return null;

  const hasNotes = value && value.trim();
  const notesVisible = hasNotes || showNotes;

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
          {notesVisible && !viewMode && (
            <div className="relative">
              <AutoResizeTextarea
                value={value || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Add any operation notes or instructions here..."
                className="min-h-[96px] text-sm bg-background border-border/60 pr-9"
              />
              {!hasNotes && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setShowNotes(false); }}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1 rounded"
                  title="Remove note"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          {notesVisible && viewMode && hasNotes && (
            <p className="text-xs text-gray-800 whitespace-pre-wrap">{value}</p>
          )}
          <OperationMedia
            items={media || []}
            onChange={onMediaChange}
            onAddNote={!notesVisible && !viewMode ? () => setShowNotes(true) : undefined}
          />
        </div>
      </CardContent>
    </Card>
  );
}