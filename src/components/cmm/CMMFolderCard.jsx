import React from "react";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { getCMMThumbnail } from "@/lib/photoSlots";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function CMMFolderCard({ folder, onOpen }) {
  const sheets = folder.sheets || [];
  const primarySheet = sheets[0];
  const opCount = sheets.length;
  const thumbnailSheet = sheets.find(s => s.is_folder_thumbnail) || null;
  const firstSheet = [...sheets].sort((a, b) => getSortKey(a) - getSortKey(b))[0] || primarySheet;
  const thumbnail = (thumbnailSheet && getCMMThumbnail(thumbnailSheet)) || getCMMThumbnail(firstSheet) || getCMMThumbnail(primarySheet);

  return (
    <div
      className="relative bg-card border border-border rounded-2xl cursor-pointer hover:shadow-md hover:border-emerald-400/40 transition-all group overflow-hidden flex flex-col"
      onClick={() => onOpen(folder)}
    >
      {/* Thumbnail image */}
      <div className="relative w-full h-36 bg-muted/30 flex items-center justify-center overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={folder.partNumber || "Part"} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center">
            <ClipboardList className="w-10 h-10 text-emerald-600/40" />
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground truncate max-w-[140px]">{folder.partNumber || "Unnamed"}</span>
          </div>
          {folder.customer && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{folder.customer}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide bg-emerald-50 text-emerald-700 shrink-0">
            {opCount} {opCount === 1 ? "Operation" : "Operations"}
          </span>
          {primarySheet?.description && (
            <span className="text-xs text-foreground font-medium truncate">{primarySheet.description}</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-[11px]">
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
    </div>
  );
}