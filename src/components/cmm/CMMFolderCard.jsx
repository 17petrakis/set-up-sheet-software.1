import React from "react";
import { ClipboardList } from "lucide-react";
import { format } from "date-fns";

export default function CMMFolderCard({ folder, onOpen }) {
  const sheet = folder.sheets[0];

  return (
    <div
      className="relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-emerald-400/40 transition-all group"
      onClick={() => onOpen(folder)}
    >
      <div className="flex items-start gap-3 mb-3">
        {sheet?.work_holding?.[0]?.photo_url ? (
          <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-muted">
            <img src={sheet.work_holding[0].photo_url} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-emerald-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground truncate">{folder.partNumber}</p>
          {folder.customer && <p className="text-xs text-muted-foreground truncate mt-0.5">{folder.customer}</p>}
        </div>
      </div>

      {sheet?.description && (
        <p className="text-xs text-muted-foreground truncate mb-2">{sheet.description}</p>
      )}

      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
        {sheet?.machine && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Machine</p>
            <p className="text-foreground font-medium truncate">{sheet.machine}</p>
          </div>
        )}
        {sheet?.updated_date && (
          <div>
            <p className="text-muted-foreground font-medium uppercase tracking-wider text-[9px]">Updated</p>
            <p className="text-foreground font-medium">{format(new Date(sheet.updated_date), "MMM d")}</p>
          </div>
        )}
      </div>
    </div>
  );
}