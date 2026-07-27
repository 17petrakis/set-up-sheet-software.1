import React from "react";
import { FileText, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function PartFolderCard({ partNumber, customer, sheets, onOpen, onDelete }) {
  const primarySheet = sheets.find(s => s.operation_number === 1) || sheets[0];
  const opCount = sheets.length;
  // First operation in display order; use its ISO image, then its drawing as the part icon
  const firstSheet = [...sheets].sort((a, b) => getSortKey(a) - getSortKey(b))[0] || primarySheet;
  const iconImage = firstSheet?.photos?.iso || firstSheet?.photos?.drawing || primarySheet?.photos?.iso || primarySheet?.photos?.drawing;

  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
      onClick={() => onOpen(partNumber, customer)}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(partNumber, customer, sheets); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-destructive/10 hover:bg-destructive text-destructive hover:text-white rounded-lg p-1.5 transition-all"
        title="Delete part folder"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        {iconImage ? (
          <img src={iconImage} alt="ISO" className="w-9 h-9 rounded-lg object-cover border border-border shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground truncate max-w-[120px]">{partNumber || "Unnamed"}</span>
            {primarySheet?.revision && (
              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                Rev {primarySheet.revision}
              </span>
            )}
          </div>
          {customer && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{customer}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-600">
          {opCount} {opCount === 1 ? "Operation" : "Operations"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
        {primarySheet?.job_number && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Job</p>
            <p className="text-foreground font-medium truncate">{primarySheet.job_number}</p>
          </div>
        )}
        {primarySheet?.part_name ? (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Part Name</p>
            <p className="text-foreground font-medium truncate">{primarySheet.part_name}</p>
          </div>
        ) : primarySheet?.machine && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Machine</p>
            <p className="text-foreground font-medium truncate">{primarySheet.machine}</p>
          </div>
        )}
        {primarySheet?.updated_date && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Updated</p>
            <p className="text-foreground font-medium">{format(new Date(primarySheet.updated_date), "MMM d, yyyy")}</p>
          </div>
        )}
      </div>
    </div>
  );
}