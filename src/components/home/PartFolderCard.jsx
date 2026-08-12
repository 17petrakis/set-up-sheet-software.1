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
      {/* Header: icon + part number + revision */}
      <div className="flex items-start gap-3 mb-3">
        {iconImage ? (
          <img src={iconImage} alt="ISO" className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground truncate sm:max-w-[120px]">{partNumber || "Unnamed"}</span>
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

      {/* Operation count + part name */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-600 shrink-0">
          {opCount} {opCount === 1 ? "Operation" : "Operations"}
        </span>
        {primarySheet?.part_name && primarySheet.part_name.trim() && (
          <span className="text-xs text-foreground font-medium truncate">{primarySheet.part_name}</span>
        )}
      </div>

      {/* Metadata: stacked rows on mobile, 3-col grid on sm+ */}
      <div className="flex flex-col gap-1.5 sm:grid sm:grid-cols-3 sm:gap-x-2 sm:gap-y-1 text-[11px]">
        {primarySheet?.job_number && (
          <div className="flex items-baseline gap-1.5 sm:block">
            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[9px] shrink-0">Job</span>
            <span className="text-foreground font-medium truncate">{primarySheet.job_number}</span>
          </div>
        )}
        {primarySheet?.machine && (
          <div className="flex items-baseline gap-1.5 sm:block">
            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[9px] shrink-0">Machine</span>
            <span className="text-foreground font-medium truncate">{primarySheet.machine}</span>
          </div>
        )}
        {primarySheet?.updated_date && (
          <div className="flex items-baseline gap-1.5 sm:block">
            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[9px] shrink-0">Updated</span>
            <span className="text-foreground font-medium">{format(new Date(primarySheet.updated_date), "MMM d, yyyy")}</span>
          </div>
        )}
      </div>
    </div>
  );
}