import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import AutoResizeTextarea from "@/components/ui/AutoResizeTextarea";
import { GripVertical, Trash2 } from "lucide-react";
import ProcessStepMedia from "./ProcessStepMedia";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProcessStepCard({ step, index, onChange, onRemove, dragHandleProps, isDragging }) {
  const set = (patch) => onChange({ ...step, ...patch });
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className={`border border-border/60 rounded-xl bg-card overflow-hidden ${isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}>
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-border/60 bg-muted/30">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
          {index + 1}
        </span>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step {index + 1}</span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="no-print flex items-center gap-1 text-xs px-2 py-0.5 rounded text-muted-foreground hover:text-destructive transition-colors"
          title="Delete step"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
        <div
          {...dragHandleProps}
          className="flex items-center justify-center w-8 h-8 shrink-0 bg-muted/40 hover:bg-muted/70 cursor-grab active:cursor-grabbing rounded-md border border-border/60"
          title="Reorder step"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>

      <div className="p-3 space-y-3">
        <Input
          value={step.title || ""}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Step title…"
          className="h-9 text-sm font-bold bg-background border-border/60"
        />
        <AutoResizeTextarea
          value={step.description || ""}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="Describe this step…"
          className="min-h-[64px] text-sm bg-background border-border/60"
        />
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Photos / Videos</p>
          <ProcessStepMedia media={step.media || []} onChange={(media) => set({ media })} />
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete step {index + 1}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the step, its description and its photos. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => { setConfirmDelete(false); onRemove(); }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}