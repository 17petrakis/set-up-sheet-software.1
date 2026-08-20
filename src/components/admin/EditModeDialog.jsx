import React from "react";
import { Hammer, Cog, ClipboardCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

const TYPES = [
  { id: "milling", label: "Milling Setup Sheet", icon: Cog, desc: "Machine, CAD software, vise model, jaw type" },
  { id: "lathe", label: "Lathe Setup Sheet", icon: Hammer, desc: "Machine, CAD software, vise model, jaw type" },
  { id: "cmm", label: "Quality Control Sheet", icon: ClipboardCheck, desc: "Post size, equipment type, machine" },
];

export default function EditModeDialog({ open, onClose, onSelect }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Dropdown Options</DialogTitle>
          <DialogDescription>
            Choose which setup sheet type's dropdowns you want to edit. Changes apply to all connected setup sheets.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 mt-2">
          {TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}