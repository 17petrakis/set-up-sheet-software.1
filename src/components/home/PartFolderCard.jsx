import React from "react";
import { FileText, Pencil, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getSheetThumbnail } from "@/lib/photoSlots";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator
} from "@/components/ui/context-menu";

const getSortKey = (s) => s.sort_order ?? new Date(s.created_date).getTime() ?? 0;

export default function PartFolderCard({ partNumber, customer, sheets, onOpen, onDelete, onDuplicate, compactOnMobile = false }) {
  const primarySheet = sheets.find(s => s.operation_number === 1) || sheets[0];
  const opCount = sheets.length;
  const thumbnailSheet = sheets.find(s => s.is_folder_thumbnail) || null;
  const firstSheet = [...sheets].sort((a, b) => getSortKey(a) - getSortKey(b))[0] || primarySheet;
  const thumbnail = (thumbnailSheet && getSheetThumbnail(thumbnailSheet)) || getSheetThumbnail(firstSheet) || getSheetThumbnail(primarySheet);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className="relative bg-card border border-border rounded-2xl cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group overflow-hidden flex flex-col"
          onClick={() => onOpen(partNumber, customer)}
        >
      {/* Phones: one compact row per part so far more fit on screen */}
      {compactOnMobile && (
        <div className="flex items-center gap-3 p-3 sm:hidden">
          <div className="relative w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
            {thumbnail ? (
              <img src={thumbnail} alt={partNumber || "Part"} className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-6 h-6 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-sm text-foreground truncate">{partNumber || "Unnamed"}</span>
              {primarySheet?.revision && (
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                  Rev {primarySheet.revision}
                </span>
              )}
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide bg-slate-100 text-slate-600 shrink-0 ml-auto">
                {opCount} {opCount === 1 ? "Op" : "Ops"}
              </span>
            </div>
            {(customer || primarySheet?.part_name?.trim()) && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {[customer, primarySheet?.part_name?.trim()].filter(Boolean).join(" · ")}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground mt-1">
              {[
                primarySheet?.job_number,
                primarySheet?.machine,
                primarySheet?.updated_date ? format(new Date(primarySheet.updated_date), "MMM d, yyyy") : null,
              ].filter(Boolean).map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-muted-foreground/50">·</span>}
                  <span className="truncate max-w-[60%]">{item}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Thumbnail image */}
      <div className={cn("relative w-full h-24 sm:h-36 bg-muted/30 flex items-center justify-center overflow-hidden", compactOnMobile && "hidden sm:flex")}>
        {thumbnail ? (
          <img src={thumbnail} alt={partNumber || "Part"} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center">
            <FileText className="w-7 h-7 sm:w-10 sm:h-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className={cn("p-3 flex flex-col gap-2 flex-1", compactOnMobile && "hidden sm:flex")}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground truncate max-w-[140px]">{partNumber || "Unnamed"}</span>
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

        <div className="flex items-center gap-2">
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
    </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-44">
        <ContextMenuItem onSelect={() => onOpen(partNumber, customer)} className="gap-2">
          <Pencil className="w-4 h-4" /> Edit
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => onDuplicate({ partNumber, customer, sheets })} className="gap-2">
          <Copy className="w-4 h-4" /> Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onDelete({ partNumber, customer, sheets })} className="gap-2 text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}