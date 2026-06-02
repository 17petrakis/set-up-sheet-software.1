import React, { useState } from "react";
import { Folder, FolderOpen, ChevronRight, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CustomerFolder({ customer, sheets, onOpen, onDelete }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden shadow-sm">
      {/* Folder header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
      >
        <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", open && "rotate-90")} />
        {open
          ? <FolderOpen className="w-4 h-4 text-primary shrink-0" />
          : <Folder className="w-4 h-4 text-primary shrink-0" />
        }
        <span className="font-semibold text-sm text-foreground flex-1">{customer}</span>
        <span className="text-xs text-muted-foreground">{sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}</span>
      </button>

      {/* Sheet rows */}
      {open && (
        <div className="divide-y divide-border/40">
          {sheets
            .slice()
            .sort((a, b) => (a.part_number || "").localeCompare(b.part_number || ""))
            .map(sheet => (
              <div
                key={sheet.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent/5 transition-colors group"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground truncate">
                      {sheet.part_number || "Unnamed"}
                    </span>
                    {sheet.revision && (
                      <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded shrink-0">
                        Rev {sheet.revision}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {sheet.job_number && (
                      <span className="text-xs text-muted-foreground">Job #{sheet.job_number}</span>
                    )}
                    {sheet.machine && (
                      <span className="text-xs text-muted-foreground">{sheet.machine}</span>
                    )}
                    {sheet.material && (
                      <span className="text-xs text-muted-foreground">{sheet.material}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onOpen(sheet.id)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(sheet.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs shrink-0"
                  onClick={() => onOpen(sheet.id)}
                >
                  Open
                </Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}