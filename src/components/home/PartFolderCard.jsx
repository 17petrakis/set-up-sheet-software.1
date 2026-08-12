import React from "react";
import { FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getPartIconPhoto } from "@/lib/photoSlots";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function PartFolderCard({ partNumber, customer, sheets, onOpen }) {
  const primarySheet = sheets.find(s => s.operation_number === 1) || sheets[0];
  const opCount = sheets.length;
  const firstSheet = [...sheets].sort((a, b) => getSortKey(a) - getSortKey(b))[0] || primarySheet;
  const iconImage = getPartIconPhoto(firstSheet?.photos) || getPartIconPhoto(primarySheet?.photos);

  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
      onClick={() => onOpen(partNumber, customer)}
    >
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
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-600 shrink-0">
          {opCount} {opCount === 1 ? "Operation" : "Operations"}
        </span>
        {primarySheet?.part_name && primarySheet.part_name.trim() && (
          <span className="text-xs text-foreground font-medium truncate">{primarySheet.part_name}</span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
        {primarySheet?.job_number && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Job</p>
            <p className="text-foreground font-medium truncate">{primarySheet.job_number}</p>
          </div>
        )}
        {primarySheet?.machine && (
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